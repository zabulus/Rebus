using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Rebus.Extensions;
using Rebus.Logging;
using Rebus.Messages;
using Rebus.Persistence.SqlServer;
using Rebus.Time;
using Rebus.Transport;
#pragma warning disable 1998

namespace Rebus.SqlServer
{

    public class RingBufferSqlTransport : ITransport, IDisposable
    {
        public const string MessagePriorityHeaderKey = "rbs2-msg-priority";
        class HeaderSerializer
        {
            static readonly Encoding DefaultEncoding = Encoding.UTF8;

            public byte[] Serialize(Dictionary<string, string> headers)
            {
                return DefaultEncoding.GetBytes(JsonConvert.SerializeObject(headers));
            }

            public Dictionary<string, string> Deserialize(byte[] bytes)
            {
                return JsonConvert.DeserializeObject<Dictionary<string, string>>(DefaultEncoding.GetString(bytes));
            }
        }
        int GetMessagePriority(Dictionary<string, string> headers)
        {
            var valueOrNull = headers.GetValueOrNull(MessagePriorityHeaderKey);
            if (valueOrNull == null) return 0;

            try
            {
                return int.Parse(valueOrNull);
            }
            catch (Exception exception)
            {
                throw new FormatException(string.Format("Could not parse '{0}' into an Int32!", valueOrNull), exception);
            }
        }

        readonly IDbConnectionProvider _connectionProvider;
        readonly string _tableName;
        readonly string _inputQueueAddress;
        readonly ILog _log;
        const int RecipientColumnSize = 200;

        readonly HeaderSerializer _headerSerializer = new HeaderSerializer();
        public RingBufferSqlTransport(IDbConnectionProvider connectionProvider, string tableName, string inputQueueAddress, IRebusLoggerFactory loggerFactory)
        {
            _connectionProvider = connectionProvider;
            _tableName = tableName;
            _inputQueueAddress = inputQueueAddress;
            _log = loggerFactory.GetCurrentClassLogger();
        }

        public void CreateQueue(string address)
        {
        }

        public string Address
        {
            get { return _inputQueueAddress; }
        }

        public async Task Send(string destinationAddress, TransportMessage message, ITransactionContext context)
        {
            GetMessagesToSend(context).Enqueue(new MessageToSend(message, destinationAddress));
        }

        public async Task<TransportMessage> Receive(ITransactionContext context)
        {
            return await ReceiveMessage(context);
        }

        private async Task<TransportMessage> ReceiveMessage(ITransactionContext context)
        {
            
            TransportMessage outputMessage = null;
            using (var connection = await _connectionProvider.GetConnection())
            {
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = $@"
UPDATE [{_tableName}]
    SET [lease] = 1
    OUTPUT INSERTED.[id], INSERTED.[headers], INSERTED.[body]
    WHERE [id] = (
        SELECT TOP 1 [id] FROM [{_tableName}] WITH (UPDLOCK, ROWLOCK, READPAST) 
            WHERE [lease] = 0 AND [visible] < getdate() 
                AND [recipient] = @recipient 
                AND expiration > getdate() ORDER BY [priority]
    )
";

                    command.Parameters.Add("recipient", SqlDbType.NVarChar, RecipientColumnSize).Value = _inputQueueAddress;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (!await reader.ReadAsync())
                        {
                            return null;
                        }

                        var headerBytes = (byte[])reader["headers"];
                        var headers = _headerSerializer.Deserialize(headerBytes);
                        var bodyBytes = (byte[])reader["body"];

                        outputMessage = new TransportMessage(headers, bodyBytes);

                        var id = (long)reader["id"];

                        context.OnCompleted(async () =>
                        {
                            await ResetLease(id, clearRow: true);
                        });

                        context.OnAborted(() =>
                        {
                            ResetLease(id).Wait();
                        });
                    }
                }

                await connection.Complete();

            }
            return outputMessage;
        }

        private async Task ResetLease(long id, bool clearRow = false)
        {
            using (var aConnection = await _connectionProvider.GetConnection())
            using (var deleteCommand = aConnection.CreateCommand())
            {
                if (clearRow)
                {
                    deleteCommand.CommandText =
                        $@"update [{_tableName}] WITH (ROWLOCK)  set lease = 0 , recipient = '' where id = @id";
                }
                else
                {
                    deleteCommand.CommandText =
                        $@"update [{_tableName}] WITH (ROWLOCK)   set lease = 0  where id = @id";
                }

                deleteCommand.Parameters.AddWithValue("id", id);

                await deleteCommand.ExecuteNonQueryAsync();

                await aConnection.Complete();
            }
        }

        ConcurrentQueue<MessageToSend> GetMessagesToSend(ITransactionContext context)
        {
            return context.GetOrAdd("ringbuffer-sql-server-outgoing-messages", () =>
            {
                var messagesToSend = new ConcurrentQueue<MessageToSend>();

                context.OnCommitted(async () =>
                {
                    await SendMessages(messagesToSend);
                });

                return messagesToSend;
            });
        }

        async Task SendMessages(ConcurrentQueue<MessageToSend> queue)
        {
            var messagesToSend = queue.EmptyIntoList();

            using (var connection = await _connectionProvider.GetConnection())
            {
                foreach (var message in messagesToSend)
                {


                    var headers = message.Headers.Clone();

                    var priority = GetMessagePriority(headers);
                    var initialVisibilityDelay = GetInitialVisibilityDelay(headers);
                    var ttlSeconds = GetTtlSeconds(headers);

                    // must be last because the other functions on the headers might change them
                    var serializedHeaders = _headerSerializer.Serialize(headers);


                    int affectedRows = 0;
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText =
                            $@"
 declare @nextSeq bigint
 select @nextSeq  =  NEXT VALUE FOR dbo.RebusSequence
UPDATE [{_tableName}] SET
    [recipient] = @recipient,
    [priority] = @priority,
    [expiration] = @expiration,
    [visible] = @visible,
    [headers] = @headers,
    [body] = @body,
    [lease] =0,
    [seq] = @nextSeq

WHERE id = (select top 1 id from [{_tableName}] where ([expiration] <getdate() or [recipient] = '') and lease = 0 order by seq)

";
                        command.Parameters.Add("recipient", SqlDbType.NVarChar, RecipientColumnSize).Value =
                            message.Destination;
                        command.Parameters.Add("headers", SqlDbType.VarBinary).Value = serializedHeaders;
                        command.Parameters.Add("body", SqlDbType.VarBinary).Value = message.Body;
                        command.Parameters.Add("priority", SqlDbType.Int).Value = priority;
                        command.Parameters.Add("expiration", SqlDbType.DateTime2).Value = RebusTime.Now.AddSeconds(ttlSeconds).DateTime;
                        command.Parameters.Add("visible", SqlDbType.DateTime2).Value = RebusTime.Now.AddSeconds(initialVisibilityDelay).DateTime;
                        affectedRows = await command.ExecuteNonQueryAsync();
                    }
                    if (affectedRows == 0)
                    {
                        using (var command = connection.CreateCommand())
                        {
                            command.CommandText =
                                $@"
 declare @nextSeq bigint
 select @nextSeq  =  NEXT VALUE FOR dbo.RebusSequence
INSERT INTO [{_tableName}]
           ([recipient]
           ,[priority]
           ,[expiration]
           ,[visible]
           ,[headers]
           ,[body]
           ,[seq])
     VALUES
           (@recipient
           ,@priority
           ,@expiration
           ,@visible
           ,@headers
           ,@body
           ,@nextSeq)

";
                            command.Parameters.Add("recipient", SqlDbType.NVarChar, RecipientColumnSize).Value =
                                message.Destination;
                            command.Parameters.Add("headers", SqlDbType.VarBinary).Value = serializedHeaders;
                            command.Parameters.Add("body", SqlDbType.VarBinary).Value = message.Body;
                            command.Parameters.Add("priority", SqlDbType.Int).Value = priority;
                            command.Parameters.Add("expiration", SqlDbType.DateTime2).Value = RebusTime.Now.AddSeconds(ttlSeconds).DateTime;
                            command.Parameters.Add("visible", SqlDbType.DateTime2).Value = RebusTime.Now.AddSeconds(initialVisibilityDelay).DateTime;
                            await command.ExecuteNonQueryAsync();
                        }

                    }
                }
                await connection.Complete();
            }
        }
        int GetInitialVisibilityDelay(Dictionary<string, string> headers)
        {
            string deferredUntilDateTimeOffsetString;

            if (!headers.TryGetValue(Headers.DeferredUntil, out deferredUntilDateTimeOffsetString))
            {
                return 0;
            }

            var deferredUntilTime = deferredUntilDateTimeOffsetString.ToDateTimeOffset();

            headers.Remove(Headers.DeferredUntil);

            return (int)(deferredUntilTime - RebusTime.Now).TotalSeconds;
        }

        static int GetTtlSeconds(Dictionary<string, string> headers)
        {
            const int defaultTtlSecondsAbout60Years = int.MaxValue;

            if (!headers.ContainsKey(Headers.TimeToBeReceived))
                return defaultTtlSecondsAbout60Years;

            var timeToBeReceivedStr = headers[Headers.TimeToBeReceived];
            var timeToBeReceived = TimeSpan.Parse(timeToBeReceivedStr);

            return (int)timeToBeReceived.TotalSeconds;
        }

        class MessageToSend
        {
            public MessageToSend(TransportMessage transportMessage, string destination)
            {
                TransportMessage = transportMessage;
                Destination = destination;
                Headers = transportMessage.Headers;
                Body = transportMessage.Body;
            }

            public Dictionary<string, string> Headers { get; }

            public TransportMessage TransportMessage { get; }
            public string Destination { get; }
            public byte[] Body { get; set; }
        }

        public void EnsureTableIsCreated()
        {
            using (var connection = _connectionProvider.GetConnection().Result)
            {
                var tableNames = connection.GetTableNames();

                if (tableNames.Contains(_tableName, StringComparer.OrdinalIgnoreCase))
                {
                    _log.Info("Database already contains a table named '{0}' - will not create anything", _tableName);
                    return;
                }

                _log.Info("Table '{0}' does not exist - it will be created now", _tableName);

                try
                {
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = @"
if not exists(select * from sys.sequences where name = 'RebusSequence')
begin
create SEQUENCE dbo.RebusSequence as bigint
    START WITH 1
    INCREMENT BY 1 ;
end
";
                        command.ExecuteNonQuery();
                    }
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = string.Format(@"
CREATE TABLE [{0}]
(
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[recipient] [nvarchar](200) NOT NULL,
	[priority] [int] NOT NULL,
    [expiration] [datetime2] NOT NULL,
    [visible] [datetime2] NOT NULL,
	[headers] [varbinary](max) NOT NULL,
	[body] [varbinary](max) NOT NULL,
    [lease] [bit] NOT NULL default(0),
    [seq] [bigint] NOT NULL
    CONSTRAINT [PK_{0}] PRIMARY KEY CLUSTERED 
    (
	    [recipient] ASC,
	    [priority] ASC,
	    [id] ASC
    )
)
", _tableName);

                        command.ExecuteNonQuery();
                    }

                    for (int i = 0; i < 100; i++)
                    {
                        using (var command = connection.CreateCommand())
                        {
                            command.CommandText =
                                $@"

declare @nextSeq bigint
 select @nextSeq  =  NEXT VALUE FOR dbo.RebusSequence
INSERT INTO [{_tableName}]
           ([recipient]
           ,[priority]
           ,[expiration]
           ,[visible]
           ,[headers]
           ,[body]
           ,[seq])
     VALUES
           (''
           ,0
           ,getdate()
           ,getdate()
           ,0x0
           ,0x0
           ,@nextSeq)
";
                            command.ExecuteNonQuery();
                        }
                    }


                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = string.Format(@"

    CREATE NONCLUSTERED INDEX [IDX_RECEIVE_{0}] ON [{0}]
(
	[recipient] ASC,
	[priority] ASC,
    [visible] ASC,
    [expiration] ASC,
	[id] ASC
)

", _tableName);

                        command.ExecuteNonQuery();
                    }
                }
                catch (SqlException exception)
                {
                    //if (exception.Number == )   
                }

                connection.Complete().Wait();
            }
        }

        public void Initialize()
        {

        }

        public void Dispose()
        {
        }
    }
}

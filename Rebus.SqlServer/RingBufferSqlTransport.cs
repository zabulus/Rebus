using System;
using System.Collections.Concurrent;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using Rebus.Logging;
using Rebus.Messages;
using Rebus.Persistence.SqlServer;
using Rebus.Transport;
#pragma warning disable 1998

namespace Rebus.SqlServer
{
    public class RingBufferSqlTransport : ITransport, IDisposable
    {
        readonly IDbConnectionProvider _connectionProvider;
        readonly string _tableName;
        readonly string _inputQueueAddress;
        readonly ILog _log;

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
            return null;
        }

        ConcurrentQueue<MessageToSend> GetMessagesToSend(ITransactionContext context)
        {
            return context.GetOrAdd("ringbuffer-sql-server-outgoing-messages", () =>
            {
                var messagesToSend = new ConcurrentQueue<MessageToSend>();
                context.OnCommitted(async () =>
                {

                });
                return messagesToSend;
            });
        }

        class MessageToSend
        {
            public MessageToSend(TransportMessage transportMessage, string destination)
            {
                TransportMessage = transportMessage;
                Destination = destination;
            }

            public TransportMessage TransportMessage { get; private set; }
            public string Destination { get; private set; }
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
                        command.CommandText = string.Format(@"
CREATE TABLE [dbo].[{0}]
(
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[recipient] [nvarchar](200) NOT NULL,
	[priority] [int] NOT NULL,
    [expiration] [datetime2] NOT NULL,
    [visible] [datetime2] NOT NULL,
	[headers] [varbinary](max) NOT NULL,
	[body] [varbinary](max) NOT NULL,
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

                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = string.Format(@"

CREATE NONCLUSTERED INDEX [IDX_RECEIVE_{0}] ON [dbo].[{0}]
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

                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = string.Format(@"

CREATE NONCLUSTERED INDEX [IDX_EXPIRATION_{0}] ON [dbo].[{0}]
(
    [expiration] ASC
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
            throw new NotImplementedException();
        }

        public void Dispose()
        {
            throw new NotImplementedException();
        }
    }
}

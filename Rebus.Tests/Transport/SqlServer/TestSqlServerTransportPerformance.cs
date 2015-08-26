using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Rebus.Messages;
using Rebus.Persistence.SqlServer;
using Rebus.Transport;
using Rebus.Transport.SqlServer;

namespace Rebus.Tests.Transport.SqlServer
{
    [TestFixture]
    public class TestSqlServerTransportPerformance : FixtureBase
    {
        const string InputQueueName = "test";
        
        SqlServerTransport _transport;

        protected override void SetUp()
        {
            SqlTestHelper.DropTable("messages");

            _transport = new SqlServerTransport(new DbConnectionProvider(SqlTestHelper.ConnectionString), "messages", InputQueueName);

            _transport.EnsureTableIsCreated();

            Using(_transport);
        }

        /// <summary>
        /// Order of index: recipient, id, priority
        /// 10000 messages - sent in 3,8 s (2606,6 msg/s) received in 19,1 s (522,4 msg/s)
        /// 10000 messages - sent in 3,7 s (2727,8 msg/s) received in 19,7 s (508,8 msg/s)
        /// 
        /// Order of index: id, recipient, priority
        /// 10000 messages - sent in 3,7 s (2723,2 msg/s) received in 71,9 s (139,0 msg/s)
        /// 
        /// 
        /// </summary>
        [TestCase(10000)]
        public void SendAndReceiveBunchOfMessages(int numberOfMessages)
        {
            var sendStopwatch = Stopwatch.StartNew();

            var sendTasks = Enumerable
                .Range(0, numberOfMessages)
                .Select(async i =>
                {
                    using (var transactionContext = new DefaultTransactionContext())
                    {
                        await _transport.Send(InputQueueName, CreateTransportMessage(i), transactionContext);

                        await transactionContext.Complete();
                    }
                });

            Task.WaitAll(sendTasks.ToArray());

            var sendTime = sendStopwatch.Elapsed;

            var receiveStopwatch = Stopwatch.StartNew();

            for (var counter = 0; counter < numberOfMessages; counter++)
            {
                using (var transactionContext = new DefaultTransactionContext())
                {
                    var receivedMessage = _transport.Receive(transactionContext).Result;

                    transactionContext.Complete().Wait();
                }
            }

            var receiveTime = receiveStopwatch.Elapsed;

            Console.WriteLine(@"

{0} messages - sent in {1:0.0} s ({2:0.0} msg/s) received in {3:0.0} s ({4:0.0} msg/s)

",
                numberOfMessages,
                sendTime.TotalSeconds, numberOfMessages/sendTime.TotalSeconds,
                receiveTime.TotalSeconds, numberOfMessages/receiveTime.TotalSeconds);
        }

        static TransportMessage CreateTransportMessage(int number)
        {
            var message = string.Format("This is message number {0} with a few words and a few words and a few words and a few words and a few words and some more words", number);

            var headers = new Dictionary<string, string>
            {
                {"custom-header1", "custom-header-value1"},
                {"custom-header2", "custom-header-value2"},
                {"custom-header3", "custom-header-value3"},
                {"custom-header4", "custom-header-value4"},
            };
            var body = Encoding.UTF8.GetBytes(message);
            return new TransportMessage(headers, body);
        }
    }
}
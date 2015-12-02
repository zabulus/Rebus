using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Rebus.Activation;
using Rebus.Config;
using Rebus.Logging;
using Rebus.Tests.Contracts.Transports;
using Rebus.Tests.Extensions;
using Rebus.Transport;
#pragma warning disable 1998

namespace Rebus.Tests.Transport.SqlServer
{
    [TestFixture(typeof(RingBufferSqlTransportFactory))]
    [TestFixture(typeof(SqlTransportFactory))]
    public class CompareSqlTransportPerformance<TFactory> : FixtureBase where TFactory : ITransportFactory, new()
    {
        ITransport _transport;
        BuiltinHandlerActivator _activator;

        protected override void SetUp()
        {
            SqlTestHelper.DropTable("RingBufferRebusMessages");

            var inputQueueAddress = TestConfig.QueueName("sqlperformance");

            _transport = new TFactory().Create(inputQueueAddress);

            _activator = new BuiltinHandlerActivator();

            Configure.With(_activator)
                .Logging(l => l.Console(LogLevel.Warn))
                .Transport(t => t.Register(c => _transport))
                .Start();
        }

        //[TestCase(5, 10000)]
        [TestCase(1, 10)]
        public async Task CheckPerformance(int numberOfThreads, int numberOfMessages)
        {
            var messageIds = Enumerable.Range(0, numberOfMessages)
                .Select(i => $"THIS IS MESSAGE {i}")
                .ToList();

            var receivedMessages = new ConcurrentDictionary<string, int>();
            var gotAllTheMessages = new ManualResetEvent(false);

            _activator.Handle<string>(async messageId =>
            {
                receivedMessages.AddOrUpdate(messageId, _ => 1, (_, count) => count + 1);

                if (receivedMessages.Count >= numberOfMessages)
                {
                    gotAllTheMessages.Set();
                }
            });

            _activator.Bus.Advanced.Workers.SetNumberOfWorkers(0);

            Console.WriteLine($"Sending {numberOfMessages} messages...");

            await Task.WhenAll(messageIds.Select(async id => await _activator.Bus.SendLocal(id)));

            Console.WriteLine($"Receiving {numberOfMessages} messages...");

            var stopwatch = Stopwatch.StartNew();

            _activator.Bus.Advanced.Workers.SetNumberOfWorkers(numberOfThreads);

            gotAllTheMessages.WaitOrDie(TimeSpan.FromSeconds(60));

            var elapsedSeconds = stopwatch.Elapsed.TotalSeconds;

            Console.WriteLine($"Received {numberOfMessages} in {elapsedSeconds:0.0} s - that's {numberOfMessages/elapsedSeconds:0.0} msg/s");
        }
    }
}
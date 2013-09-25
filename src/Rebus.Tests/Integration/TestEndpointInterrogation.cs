using System;
using System.Collections.Generic;
using System.Threading;
using NUnit.Framework;
using Rebus.Configuration;
using Rebus.Messages;
using Rebus.Shared;
using Rebus.Transports.Msmq;
using Shouldly;
using Rebus.Logging;

namespace Rebus.Tests.Integration
{
    [TestFixture, Category(TestCategories.Integration)]
    public class TestEndpointInterrogation : FixtureBase
    {
        const string InputQueueName = "test.interrogation.input";
        const int NumberOfWorkers = 3;
        readonly List<IDisposable> stuffToDispose = new List<IDisposable>();
        BuiltinContainerAdapter adapter;

        protected override void DoSetUp()
        {
            adapter = new BuiltinContainerAdapter();
            stuffToDispose.Add(adapter);

            var startable = Configure.With(adapter)
                                     .Logging(l => l.None())
                                     .Transport(t => t.UseMsmq(InputQueueName, "error"))
                                     .CreateBus();

            startable.Start(NumberOfWorkers);
        }

        protected override void DoTearDown()
        {
            stuffToDispose.ForEach(d => d.Dispose());
            
            MsmqUtil.Delete(InputQueueName);
        }

        [Test]
        public void CanInterrogateEndpoint()
        {
            var resetEvent = new ManualResetEvent(false);
            EndpointInterrogationReply reply = null;
            adapter.Handle<EndpointInterrogationReply>(r =>
                {
                    reply = r;
                    resetEvent.Set();
                });

            adapter.Bus.SendLocal(new EndpointInterrogationRequest());
            var timeout = 2.Seconds();
            Assert.That(resetEvent.WaitOne(timeout), Is.True, "Did not receive interrogation reply within {0} timeout", timeout);
            Assert.That(reply, Is.Not.Null, "Expected that the reply variable had been set by now");

            Console.WriteLine(@"Got interrogation reply:

{0}", reply);

            reply.Success.ShouldBe(true);
            reply.InterrogationErrors.Count.ShouldBe(0);

            reply.RebusEndpointInfo.OneWayClientMode.ShouldBe(false);
            reply.RebusEndpointInfo.InputQueueAddress.ShouldContain(InputQueueName);
            reply.RebusEndpointInfo.Workers.ShouldBe(NumberOfWorkers);
        }
    }
}
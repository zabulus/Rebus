using System;
using System.Collections.Generic;
using System.Threading;
using NUnit.Framework;
using Rebus.BusHub.Client;
using Rebus.BusHub.Hub;
using Rebus.BusHub.Messages;
using Shouldly;
using System.Linq;

namespace Rebus.BusHub.Tests
{
    [TestFixture]
    public class BasicBusHubTests : FixtureFor<BusHubService>
    {
        TestMessageHandler testMessageHandler;

        protected override BusHubService SetUpInstance()
        {
            testMessageHandler = new TestMessageHandler();
            var service = new BusHubService("http://+:24000/", new IMessageHandler[] { testMessageHandler });

            return service;
        }

        [Test]
        public void CanStart()
        {
            try
            {
                instance.Start();

                using (var client = new BusHubClient("http://localhost:24000"))
                {
                    client.Send(new Heartbeat());
                }

                Thread.Sleep(TimeSpan.FromSeconds(1));

                testMessageHandler.ReceivedMessages.Count.ShouldBe(1);
                testMessageHandler.ReceivedMessages.Single().ShouldBeTypeOf<Heartbeat>();
            }
            finally
            {
                instance.Stop();
            }
        }

        class TestMessageHandler : IMessageHandler<Heartbeat>
        {
            public TestMessageHandler()
            {
                ReceivedMessages = new List<object>();
            }

            public List<object> ReceivedMessages { get; set; }

            public void Handle(Heartbeat message)
            {
                ReceivedMessages.Add(message);
            }
        }
    }
}

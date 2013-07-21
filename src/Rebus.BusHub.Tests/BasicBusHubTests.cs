using System;
using System.Threading;
using NUnit.Framework;
using Rebus.BusHub.Client;
using Rebus.BusHub.Hub;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Tests
{
    [TestFixture]
    public class BasicBusHubTests : FixtureFor<BusHubService>
    {
        BusHubClient client;

        protected override BusHubService SetUpInstance()
        {
            client = new BusHubClient("http://localhost:24000");
            
            return new BusHubService("http://+:24000/");
        }

        [Test]
        public void CanStart()
        {
            try
            {
                instance.Start();

                client.Send(new Heartbeat());

                Thread.Sleep(TimeSpan.FromSeconds(1));

                Assert.Fail("verify that the bus hub got the heartbeat");
            }
            finally
            {
                instance.Stop();
            }
        }
    }
}

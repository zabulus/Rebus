using System.Collections.Generic;
using System.Threading.Tasks;
using FakeItEasy;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using NUnit.Framework;
using Newtonsoft.Json.Linq;
using Rebus.Configuration;
using Rebus.FleetKeeper;
using Rebus.FleetKeeper.Client;

namespace Rebus.Tests.FleetKeeper
{
    public class TestFleetKeeperHub
    {
        [Test]
        public void Test()
        {
            Configure.With(new BuiltinContainerAdapter())
                .Logging(x => { })
                .EnableFleetKeeper("http://localhost:8080");
        }

        [Test]
        public void CanApplySerializedBusStartedEvent()
        {
            var hub = new FleetKeeperHub();

            hub.Clients = A.Fake<IHubCallerConnectionContext>();

            hub.Apply(JObject.FromObject(new
                {
                    Name = "BusStarted"
                }));
        }
    }
}
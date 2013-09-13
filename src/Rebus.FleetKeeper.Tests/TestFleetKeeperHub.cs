using System;
using System.Dynamic;
using FakeItEasy;
using Microsoft.AspNet.SignalR.Hubs;
using NUnit.Framework;
using Newtonsoft.Json.Linq;
using Rebus.Configuration;
using Rebus.FleetKeeper.Client;

namespace Rebus.FleetKeeper.Tests
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
            var hub = new FleetKeeperHub {Clients = A.Fake<IHubCallerConnectionContext>()};

            dynamic client = new ExpandoObject();
            client.notifyBusStarted = new Action<object>(message => { });

            A.CallTo(() => hub.Clients.Group("webclients")).Returns(new CallWhatEverYouWant());

            hub.Apply(JObject.FromObject(new
                {
                    Name = "BusStarted"
                }));
        }

        public class CallWhatEverYouWant : DynamicObject
        {
            public override bool TryInvokeMember(InvokeMemberBinder binder, object[] args, out object result)
            {
                result = null;
                return true;
            }
        }
    }
}
using System;
using System.Data;
using FakeItEasy;
using Microsoft.AspNet.SignalR.Hubs;
using NUnit.Framework;

namespace Rebus.FleetKeeper.Tests
{
    public class TestServicesView : IDisposable
    {
        readonly CallWhatEverYouWant fakeGroupOfClients;
        readonly ServicesView aggregate;

        public TestServicesView()
        {
            var hub = new FleetKeeperHub(A.Fake<IDbConnection>())
            {
                Clients = A.Fake<IHubCallerConnectionContext>()
            };

            fakeGroupOfClients = new CallWhatEverYouWant();
            A.CallTo(() => hub.Clients.Group("webclients")).Returns(fakeGroupOfClients);

            aggregate = new ServicesView();
            fakeGroupOfClients = new CallWhatEverYouWant();
        }

        [Test]
        public void CanApplyBusStartedEvent()
        {
            var id = Guid.NewGuid();

            //aggregate.Apply(TODO, new
            //{
            //    Name = "BusStarted",
            //    BusClientId = id,
            //    Endpoint = "EndpointAddress"
            //}.ToJObject());

            //aggregate.Services.ShouldContain();
        }

        [Test]
        public void CanApplyBusStoppedEvent()
        {
            ////var id = Guid.NewGuid();
            ////hub.Apply(new
            ////{
            ////    Name = "BusStopped",
            ////    BusClientId = id,
            ////    Endpoint = "EndpointAddress"
            ////}.ToJObject());

            //var expected = new
            //{
            //    BusClientId = id,
            //    Endpoint = "EndpointAddress"
            //};

            //fakeGroupOfClients.Calls["notifyBusStopped"]
            //    .Arguments[0].ToJson()
            //                 .ShouldBe(expected.ToJson());
        }

        public void Dispose()
        {
            //dbConnection.Dispose();
        }
    }
}
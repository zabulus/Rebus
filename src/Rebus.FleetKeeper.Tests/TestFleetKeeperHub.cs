using System;
using System.Data.SQLite;
using System.Linq;
using Dapper;
using FakeItEasy;
using Microsoft.AspNet.SignalR.Hubs;
using NUnit.Framework;
using Shouldly;

namespace Rebus.FleetKeeper.Tests
{
    public class TestFleetKeeperHub : IDisposable
    {
        readonly TestView view;
        readonly SQLiteConnection dbConnection;
        readonly CallWhatEverYouWant fakeGroupOfClients;
        readonly FleetKeeperHub hub;

        public TestFleetKeeperHub()
        {
            dbConnection = new SQLiteConnection("Data Source=:memory:;Version=3;New=True;");
            dbConnection.Open();

            view = new TestView();
            hub = new FleetKeeperHub(dbConnection)
            {
                Clients = A.Fake<IHubCallerConnectionContext>()
            };

            fakeGroupOfClients = new CallWhatEverYouWant();
            A.CallTo(() => hub.Clients.Group("webclients")).Returns(fakeGroupOfClients);
        }

        public void Dispose()
        {
            dbConnection.Dispose();
        }

        [Test]
        public void CanPersistEvent()
        {
            hub.Persist(new
            {
                Name = "SomeEvent"
            }.ToJObject());

            var result = dbConnection.Query<string>("select Data from Events").ToList();
            result.Count.ShouldBe(1);
            result[0].ShouldBe(new {Name = "SomeEvent"}.ToJson());
        }

        [Test]
        public void AppliesBusStartedEvent()
        {
            var @event = new
            {
                Name = "BusStarted",
                SomeProperty = "SomeValue"
            }.ToJObject();

            //hub.Apply(TODO, @event);

            view.Calls.ShouldContainKeyAndValue("BusStarted", @event);
        }

        [Test]
        public void AppliesBusStoppedEvent()
        {
            var @event = new
            {
                Name = "BusStopped",
                SomeProperty = "SomeValue"
            }.ToJObject();

            //hub.Apply(TODO, @event);

            view.Calls.ShouldContainKeyAndValue("BusStarted", @event);
        }
    }
}
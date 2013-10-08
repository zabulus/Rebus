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
            var busClientId = Guid.NewGuid();
            var @event = new
            {
                Id = Guid.NewGuid(), 
                BusClientId = busClientId, 
                Version = 1, 
                Name = "SomeEvent",
            };

            hub.Persist(@event.ToJObject());

            var result = dbConnection.Query<dynamic>("select AggregateId, Version, Data from Events").ToList();
            result.Count.ShouldBe(1);
            
            ((string)result[0].AggregateId).ShouldBe(busClientId.ToString());
            ((long)result[0].Version).ShouldBe(1);
            ((string)result[0].Data).ShouldBe(@event.ToJson());
        }

        [Test]
        public void RetainsOutOfOrderMessages()
        {
            var busClientId = Guid.NewGuid();

            var @event2 = new
            {
                Id = Guid.NewGuid(),
                BusClientId = busClientId,
                Version = 2,
                Name = "SomeEvent",
            };

            hub.Persist(@event2.ToJObject());

            var result = dbConnection.Query<dynamic>("select AggregateId, Version, Data from Events").ToList();
            result.Count.ShouldBe(0);
        }

        [Test]
        public void RetainsOutOfOrderMessages2()
        {
            var busClientId = Guid.NewGuid();
            var @event1 = new
            {
                Id = Guid.NewGuid(),
                BusClientId = busClientId,
                Version = 1,
                Name = "SomeEvent",
            };

            var @event2 = new
            {
                Id = Guid.NewGuid(),
                BusClientId = busClientId,
                Version = 2,
                Name = "SomeEvent",
            };

            hub.Persist(@event2.ToJObject());

            

            hub.Persist(@event1.ToJObject());

            var result = dbConnection.Query<dynamic>("select AggregateId, Version, Data from Events").ToList();
            result.Count.ShouldBe(1);

            ((string)result[0].AggregateId).ShouldBe(busClientId.ToString());
            ((long)result[0].Version).ShouldBe(1);
            ((string)result[0].Data).ShouldBe(@event1.ToJson());
        }
    
    }
}
using System;
using System.Data.SQLite;
using System.Linq;
using System.Reactive.Subjects;
using System.Threading.Tasks;
using Dapper;
using FakeItEasy;
using Microsoft.AspNet.SignalR.Hubs;
using NUnit.Framework;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Old;
using Shouldly;

namespace Rebus.FleetKeeper.Tests
{
    public class TestWriter : IDisposable
    {
        SQLiteConnection dbConnection;
        Subject<JObject> subject;
        Writer writer;

        [SetUp]
        public void Setup()
        {
            dbConnection = new SQLiteConnection("Data Source=:memory:;Version=3;New=True;");
            dbConnection.Open();

            subject = new Subject<JObject>();
            writer = new Writer(dbConnection, subject);           
        }

        [TearDown]
        public void TearDown()
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
                Name = "SomeEvent"
            };

            subject.OnNext(@event.ToJObject());

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

            subject.OnNext(@event2.ToJObject());

            var result = dbConnection.Query<dynamic>("select AggregateId, Version, Data from Events").ToList();
            result.Count.ShouldBe(0);
        }

        [Test]
        public void ReordersMessages()
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

            subject.OnNext(@event2.ToJObject());
            subject.OnNext(@event1.ToJObject());

            var result = dbConnection.Query<dynamic>("select AggregateId, Version, Data from Events").ToList();
            result.Count.ShouldBe(2);
            ((long)result[0].Version).ShouldBe(1);
            ((long)result[1].Version).ShouldBe(2);
        }        
        
        [Test]
        public void ReordersMessages2()
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

            var @event3 = new
            {
                Id = Guid.NewGuid(),
                BusClientId = busClientId,
                Version = 3,
                Name = "SomeEvent",
            };
            
            var @event4 = new
            {
                Id = Guid.NewGuid(),
                BusClientId = busClientId,
                Version = 4,
                Name = "SomeEvent",
            };

            subject.OnNext(@event4.ToJObject());
            subject.OnNext(@event3.ToJObject());
            subject.OnNext(@event2.ToJObject());
            subject.OnNext(@event1.ToJObject());

            var result = dbConnection.Query<dynamic>("select AggregateId, Version, Data from Events").ToList();
            ((long)result[0].Version).ShouldBe(1);
            ((long)result[1].Version).ShouldBe(2);
            ((long)result[2].Version).ShouldBe(3);
            ((long)result[3].Version).ShouldBe(4);
        }

        [Test]
        public void ReordersMessages3()
        {
            var busClientId = Guid.NewGuid();

            Parallel.For(0, 100, i =>
            {
                var @event1 = new
                {
                    Id = Guid.NewGuid(),
                    BusClientId = busClientId,
                    Version = i+1,
                    Name = "SomeEvent",
                };
                subject.OnNext(@event1.ToJObject());
            });

            var result = dbConnection.Query<dynamic>("select AggregateId, Version, Data from Events").ToList();
            result.Count.ShouldBe(100);
            for (int i = 0; i < 100; i++)
            {
                ((long)result[i].Version).ShouldBe(i+1);
            }
        }

        public void Dispose()
        {
            dbConnection.Dispose();
        }
    }

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
            hub = new FleetKeeperHub(dbConnection, new Subject<JObject>())
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
        public void FailsOnDuplicateEvents()
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
            Should.Throw<Exception>(() => hub.Persist(@event.ToJObject()));
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
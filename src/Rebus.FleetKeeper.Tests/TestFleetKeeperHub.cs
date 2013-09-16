using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Dynamic;
using Dapper;
using FakeItEasy;
using Microsoft.AspNet.SignalR.Hubs;
using NUnit.Framework;
using Newtonsoft.Json.Linq;
using Shouldly;
using System.Linq;

namespace Rebus.FleetKeeper.Tests
{
    public class TestFleetKeeperHub : IDisposable
    {
        readonly FleetKeeperHub hub;
        readonly CallWhatEverYouWant fakeGroupOfClients;
        readonly SQLiteConnection dbConnection;

        public TestFleetKeeperHub()
        {
            dbConnection = new SQLiteConnection("Data Source=:memory:;Version=3;New=True;");
            dbConnection.Open();
            hub = new FleetKeeperHub(dbConnection) { Clients = A.Fake<IHubCallerConnectionContext>() };
            fakeGroupOfClients = new CallWhatEverYouWant();
            A.CallTo(() => hub.Clients.Group("webclients")).Returns(fakeGroupOfClients);
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
            result[0].ShouldBe(new { Name = "SomeEvent" }.ToJson());
        }
        
        [Test]
        public void CanApplyBusStartedEvent()
        {
            var id = Guid.NewGuid();
            hub.Apply(new
            {
                Name = "BusStarted",
                SourceBusId = id
            }.ToJObject());

            fakeGroupOfClients.Calls["notifyBusStarted"].Arguments[0].ToJson().ShouldBe(new { SourceBusId = id }.ToJson());
        }

        public class CallWhatEverYouWant : DynamicObject
        {
            public CallWhatEverYouWant()
            {
                Calls = new Dictionary<string, Call>();
            }

            public Dictionary<string, Call> Calls { get; set; }

            public override bool TryInvokeMember(InvokeMemberBinder binder, object[] args, out object result)
            {
                Calls.Add(binder.Name, new Call { Arguments = args.ToList() });

                result = null;
                return true;
            }

            public class Call
            {
                public List<object> Arguments { get; set; }
            }
        }

        public void Dispose()
        {
            dbConnection.Dispose();
        }
    }

    public static class TestEx
    {
        public static JObject ToJObject(this object receiver)
        {
            return JObject.FromObject(receiver);
        }

        public static string ToJson(this object receiver)
        {
            return JObject.FromObject(receiver).ToString();
        }
    }
}
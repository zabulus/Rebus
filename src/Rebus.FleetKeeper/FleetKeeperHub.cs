using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Client.Events;

namespace Rebus.FleetKeeper
{
    public class FleetKeeperHub : Hub
    {
        readonly SQLiteConnection dbConnection;
        readonly Dictionary<string, Type> handledEvents;

        /* On fk web client connect get a snapshot of the current status from persistence
         * 
         * When a fk server get snapshot from all busses that can gve them
         * When a bus is started get snapshot from bus
         * 
         * Snapshot: number of messages currently in inputqueue and error queue that are for this bus
         * 
         * 
         * Bus started
         * Transport message received
         * Message handled/failed
         * Message failed
         * Bus stopped
         * Log appended
         *
         *
         * 
         */

        public FleetKeeperHub()
        {
            dbConnection = new SQLiteConnection("Data Source=fleetkeeper.db;ContractVersion=3;New=False;Compress=True;");
            dbConnection.Execute(@"
                create table if not exists events (
                Id integer primary key autoincrement,
                Message text)");

            handledEvents = new[]
            {
                typeof (BusStarted), 
                typeof (BusStopped)
            }.ToDictionary(x => x.Name, x => x);
        }

        public Task AsWebClient()
        {
            return Groups.Add(Context.ConnectionId, "webclients");
        }

        public Task AsBusClient()
        {
            return Groups.Add(Context.ConnectionId, "busclients");
        }

        public void ReceiveFromBus(JObject @event)
        {
            Persist(@event);

            Type type;
            var eventname = (string) @event["Name"];
            if (handledEvents.TryGetValue(eventname, out type))
            {
                Apply((dynamic)@event.ToObject(type));
            }
        }

        void Persist(JObject @event)
        {
            dbConnection.Execute("insert into events (Message) values (@Message)", new {Message = @event.ToString()});
        }

        void Apply(BusStarted @event)
        {
            Clients
                .Group("webclients")
                .notifyBusStarted(new
                {
                });
        }

        void Apply(BusStopped @event)
        {
            Clients
                .Group("webclients")
                .notifyBusStopped(new
                {
                });
        }

        public void SendToBus(string message)
        {
            Clients.All.addEndpoint(message);
        }

        protected override void Dispose(bool disposing)
        {
            dbConnection.Dispose();
        }
    }
}
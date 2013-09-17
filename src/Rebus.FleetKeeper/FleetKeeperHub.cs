using System;
using System.Collections.Generic;
using System.Data;
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
        readonly IDbConnection dbConnection;

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

        public FleetKeeperHub(IDbConnection dbConnection)
        {
            this.dbConnection = dbConnection;
            dbConnection.Execute(@"
                create table if not exists Events (
                Id integer primary key autoincrement,
                Data text)");
        }

        public async Task AsWebClient()
        {
            await Groups.Add(Context.ConnectionId, "webclients");
            
            var events = dbConnection.Query<string>("select Data from Events");
            foreach (var @event in events)
                Apply(JObject.Parse(@event));
        }

        public Task AsBusClient()
        {
            return Groups.Add(Context.ConnectionId, "busclients");
        }

        public void ReceiveFromBus(JObject @event)
        {
            Persist(@event);
            Apply(@event);
        }

        public void SendToBus(string message)
        {
            Clients.All.addEndpoint(message);
        }

        internal void Persist(JObject @event)
        {
            dbConnection.Execute("insert into Events (Data) values (@Data)", new {Data = @event.ToString()});
        }

        internal void Apply(JObject @event)
        {
            var eventname = (string)@event["Name"];
            switch (eventname)
            {
                case "BusStarted":
                    ApplyBusStarted(@event);
                    break;
                case "BusStopped":
                    ApplyBusStopped(@event);
                    break;
            }
        }

        void ApplyBusStarted(JObject @event)
        {
            Clients
                .Group("webclients")
                .notifyBusStarted(new
                {
                    SourceBusId = @event["SourceBusId"]
                });
        }

        void ApplyBusStopped(JObject @event)
        {
            Clients
                .Group("webclients")
                .notifyBusStopped(new
                {

                });
        }

        protected override void Dispose(bool disposing)
        {
            dbConnection.Dispose();
        }
    }
}
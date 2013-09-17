using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;

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

            var aggregate = LoadAggregate();
            aggregate.ApplyStateToClient();
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

        public void Apply(JObject @event)
        {
            var aggregate = LoadAggregate();
            aggregate.Apply(@event, applyToClient: true);
        }

        Aggregate LoadAggregate()
        {
            var events = dbConnection.Query<string>("select Data from Events");
            var aggregate = (Aggregate) Activator.CreateInstance(typeof (BusAggregate), this);
            aggregate.LoadFromHistory(events.Select(JObject.Parse));
            return aggregate;
        }

        protected override void Dispose(bool disposing)
        {
            dbConnection.Dispose();
        }
    }
}
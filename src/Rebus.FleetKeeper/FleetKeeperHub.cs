using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using log4net;
using System.Linq;

namespace Rebus.FleetKeeper
{
    public class FleetKeeperHub : Hub
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        readonly IDbConnection dbConnection;

        public FleetKeeperHub(IDbConnection dbConnection)
        {
            this.dbConnection = dbConnection;
            
            Log.Debug("Ensuring 'Events' table exists");

            dbConnection.Execute(@"
                create table if not exists Events (
                Id integer primary key autoincrement,
                Data text)");
        }

        public async Task AsWebClient()
        {
            Log.DebugFormat("New web client: {0}", Context.ConnectionId);

            await Groups.Add(Context.ConnectionId, "webclients");

            var aggregate = LoadAggregate();
            aggregate.ApplyStateToClient();
        }

        public Task AsBusClient()
        {
            Log.DebugFormat("New bus client: {0}", Context.ConnectionId);

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
            Log.DebugFormat("Inserting {0}", (string)@event["Name"]);

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
            var numberOfEvents = aggregate.LoadFromHistory(events.Select(JObject.Parse));
            
            Log.DebugFormat("'Replaying' {0} events to {1}", numberOfEvents, Context.ConnectionId);

            return aggregate;
        }

        protected override void Dispose(bool disposing)
        {
            Log.Info("Disposing DB connection");
            dbConnection.Dispose();
        }
    }
}
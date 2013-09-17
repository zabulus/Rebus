using System.Data;
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

            var events = dbConnection.Query<string>("select Data from Events")
                                     .ToList();
            
            Log.DebugFormat("'Replaying' {0} events to {1}", events.Count, Context.ConnectionId);
            
            foreach (var @event in events)
            {
                Apply(JObject.Parse(@event));
            }
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
          //  Log.Info("Disposing DB connection");
         //   dbConnection.Dispose();
        }
    }
}
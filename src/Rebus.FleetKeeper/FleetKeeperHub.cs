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

namespace Rebus.FleetKeeper
{
    public class FleetKeeperHub : Hub
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        static readonly Dictionary<string, Type> Views =
            new Dictionary<string, Type>
            {
                { "services", typeof(ServicesView) }
            };

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

        public async Task AsWebClient(string view)
        {
            Log.DebugFormat("New web client: {0}", Context.ConnectionId);

            await Groups.Add(Context.ConnectionId, "webclients/" + view);

            var type = Views[view];
            var aggregate = LoadView(type);

            Log.DebugFormat("Sending state of {0} to {1}", type.Name, Context.ConnectionId);

            Clients.Caller.execute(
                view,
                new Replace
                {
                    Path = "",
                    Value = aggregate
                });
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
            foreach (var key in Views.Keys)
            {
                var type = Views[key];
                var view = LoadView(type);

                var eventname = (string) @event["Name"];

                Log.DebugFormat("Applying event {0} to {1}", eventname, GetType().Name);

                var patch = view.Apply(@event);

                if (patch != null)
                {
                    Log.DebugFormat("Sending resulting changes of event {0} to {1} to web client.", eventname, type.Name);
                    Clients.Group("webclients/" + key).execute(key, patch);
                }
                else
                {
                    Log.DebugFormat("Event {0} resulted in no changes to {1}", eventname, type.Name);
                }

                // time for snapshot? Maybe. Can we just snapshot to memory?
            }
        }

        ReadModel LoadView(Type type)
        {
            var events = dbConnection.Query<string>("select Data from Events");
            var aggregate = (ReadModel) Activator.CreateInstance(type);
            var numberOfEvents = aggregate.LoadFromHistory(events.Select(JObject.Parse));
            
            Log.DebugFormat("'Replaying' {0} events to {1}", numberOfEvents, type.Name);

            return aggregate;
        }

        protected override void Dispose(bool disposing)
        {
            Log.Info("Disposing DB connection");
            dbConnection.Dispose();
        }
    }

    public class JsonAction
    {
        public string Op 
        {
            get { return GetType().Name.ToLowerInvariant(); }
        }

        public string Path { get; set; }
    }

    public class Replace : JsonAction
    {
        public object Value { get; set; }
    }

    public class Add : JsonAction
    {
        public object Value { get; set; }
    }
}
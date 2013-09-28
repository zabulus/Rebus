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
                Sequence integer primary key autoincrement,
                AggregateId text,
                Version integer,
                Data text)");
        }

        public async Task AsWebClient(string viewname)
        {
            Log.DebugFormat("New web client: {0}", Context.ConnectionId);

            await Groups.Add(Context.ConnectionId, "webclients/" + viewname);

            var type = Views[viewname];
            var view = LoadView(type);

            Log.DebugFormat("Sending state of {0} to {1}", type.Name, Context.ConnectionId);

            Clients.Caller.execute(
                viewname,
                new Replace
                {
                    Path = "",
                    Value = view,
                    Version = view.Version
                });
        }

        public Task AsBusClient()
        {
            Log.DebugFormat("New bus client: {0}", Context.ConnectionId);

            return Groups.Add(Context.ConnectionId, "busclients");
        }

        public void ReceiveFromBus(JObject @event)
        {
            var sequence = Persist(@event);
            Apply(sequence, @event);
        }

        public void SendToBus(string message)
        {
            Clients.All.addEndpoint(message);
        }

        List<JObject> pendingEvents = new List<JObject>(); 

        internal long Persist(JObject @event)
        {
            Log.DebugFormat("Inserting {0} ({1})", (string)@event["Name"], (Guid)@event["Id"]);

            var sequence = dbConnection.Query<long>(
                "insert into Events (AggregateId, Version, Data) values (@AggregateId, @Version, @Data);" +
                "select last_insert_rowid();", 
                new
                {
                    AggregateId = (Guid)@event["BusClientId"],
                    Version = (long)@event["Version"],
                    Data = @event.ToString()
                }).Single();

            if (sequence == 0) // or last sequence
            {
                pendingEvents.Add(@event);
            }

            Log.DebugFormat("Inserted {0} ({1}) and got sequence number {2}", (string)@event["Name"], (Guid)@event["Id"], sequence);

            return sequence;
        }

        public void Apply(long sequence, JObject @event)
        {
            foreach (var key in Views.Keys)
            {
                var type = Views[key];
                var view = LoadView(type);

                var eventname = (string) @event["Name"];

                //var patch = view.Apply(sequence, @event);

                if (view.Changes.Any())
                {
                    Log.DebugFormat("Sending resulting changes of event {0} to {1} to web client.", eventname, type.Name);
                    foreach (var patch in view.Changes)
                    {
                        Clients.Group("webclients/" + key).execute(key, patch);
                    }
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
            Log.DebugFormat("Loading view {0}", type.Name);

            // Split this into snapshot load and replay
            var events = dbConnection.Query<dynamic>("select Sequence, Data from Events");
            var view = (ReadModel) Activator.CreateInstance(type);
            view.LoadFromHistory(events.Select(@event => Tuple.Create((long)@event.Sequence, JObject.Parse((string)@event.Data))));
            
            Log.DebugFormat("'Replaying' {0} events to {1}", view.Changes.Count, type.Name);

            return view;
        }

        protected override void Dispose(bool disposing)
        {
            Log.Info("Disposing DB connection");
            dbConnection.Dispose();
        }
    }

    public class JsonPatch
    {
        public string Op 
        {
            get { return GetType().Name.ToLowerInvariant(); }
        }

        public string Path { get; set; }
        public long Version { get; set; }
    }

    public class Replace : JsonPatch
    {
        public object Value { get; set; }
    }

    public class Add : JsonPatch
    {
        public object Value { get; set; }
    }

    public class Remove : JsonPatch
    {
    }
}
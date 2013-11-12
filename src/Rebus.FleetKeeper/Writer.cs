using System;
using System.Data;
using System.Linq;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Reflection;
using Dapper;
using Newtonsoft.Json.Linq;
using log4net;

namespace Rebus.FleetKeeper
{
    public class Writer
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        readonly IDbConnection dbConnection;

        public Writer(IDbConnection dbConnection, IObservable<JObject> events)
        {
            this.dbConnection = dbConnection;

            Log.Debug("Ensuring 'Events' table exists");

            dbConnection.Execute(@"
                begin;   
                create table if not exists Events (
                Sequence integer primary key autoincrement,
                AggregateId text,
                Version integer,
                Data text);
                
                create unique index aggregateid_version on Events (AggregateId, Version);
                commit;");

            var writerThread = new EventLoopScheduler();

            events.ObserveOn(writerThread)
                  .OrderBy(x => (long) x["Version"])
                  .Subscribe(Persist);
        }

        void Persist(JObject @event)
        {
            Log.DebugFormat("Inserting {0} ({1})", (string) @event["Name"], (Guid) @event["Id"]);

            var sequence = dbConnection.Query<long>(
                "insert into Events (AggregateId, Version, Data) values (@AggregateId, @Version, @Data);" +
                "select last_insert_rowid();",
                new
                {
                    AggregateId = (string) @event["BusClientId"],
                    Version = (long) @event["Version"],
                    Data = @event.ToString()
                }).Single();

            Log.DebugFormat("Inserted {0} ({1}) and got sequence number {2}", (string) @event["Name"], (Guid) @event["Id"], sequence);
        }
    }
}
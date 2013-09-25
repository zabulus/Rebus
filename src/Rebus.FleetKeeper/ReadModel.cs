using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper
{
    public abstract class ReadModel
    {
        public int LoadFromHistory(IEnumerable<JObject> @events)
        {
            var count = 0;
            foreach (var @event in events)
            {
                Apply(@event);
                count++;
            }

            return count;
        }

        public JsonAction Apply(JObject @event)
        {
            var eventname = (string) @event["Name"];
            switch (eventname)
            {
                case "BusStarted":
                    return ApplyBusStarted(@event);
                case "BusStopped":
                    return ApplyBusStopped(@event);
            }

            return null;
        }

        public abstract JsonAction ApplyBusStarted(JObject @event);
        public abstract JsonAction ApplyBusStopped(JObject @event);
        public abstract JsonAction ApplyHeartbeat(JObject @event);
    }
}
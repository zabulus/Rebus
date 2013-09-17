using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper
{
    public abstract class Aggregate
    {
        public void LoadFromHistory(IEnumerable<JObject> @events)
        {
            foreach (var @event in events)
            {
                Apply(@event, false);
            }
        }

        public void Apply(JObject @event, bool applyToClient)
        {
            var eventname = (string) @event["Name"];
            switch (eventname)
            {
                case "BusStarted":
                    ApplyBusStarted(@event, applyToClient);
                    break;
                case "BusStopped":
                    ApplyBusStopped(@event, applyToClient);
                    break;
            }
        }

        public abstract void ApplyStateToClient();
        public abstract void ApplyBusStarted(JObject @event, bool applyToClient);
        public abstract void ApplyBusStopped(JObject @event, bool applyToClient);
    }


}
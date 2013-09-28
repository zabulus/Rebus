using System;
using System.Collections.Generic;
using System.Reflection;
using Newtonsoft.Json.Linq;
using log4net;

namespace Rebus.FleetKeeper
{
    public abstract class ReadModel
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        protected ReadModel()
        {
            Changes = new List<JsonPatch>();
        }

        public long Version { get; private set; }
        public List<JsonPatch> Changes { get; private set; }

        public void LoadFromHistory(IEnumerable<Tuple<long, JObject>> @events)
        {
            foreach (var @event in events)
            {
                Changes.Add(Apply(@event.Item1, @event.Item2));
            }
        }

        public JsonPatch Apply(long sequence, JObject @event)
        {
            if (sequence != Version + 1)
            {
                throw new InvalidOperationException(
                    string.Format("Tried to apply an event to a read model in the wrong order." +
                                  " Expected an event with seqeuence number {0}, but got {1}", (Version + 1), sequence));
            }

            Version = sequence;

            var eventId = (string)@event["Id"];
            var eventName = (string)@event["Name"];

            Log.Debug(string.Format("Applying event {0} ({1}) with sequence number {2}", eventName, eventId, sequence));

            switch (eventName)
            {
                case "BusStarted":
                    return ApplyBusStarted(@event);
                case "MessageReceived":
                    return ApplyMessageReceived(@event);
                case "MessageHandled":
                    return ApplyMessageHandled(@event);
                case "HeartBeat":
                    return ApplyHeartbeat(@event);
                case "BusStopped":
                    return ApplyBusStopped(@event);
            }

            return null;
        }

        public abstract JsonPatch ApplyBusStarted(JObject @event);
        public abstract JsonPatch ApplyMessageReceived(JObject @event);
        public abstract JsonPatch ApplyMessageHandled(JObject @event);
        public abstract JsonPatch ApplyHeartbeat(JObject @event);
        public abstract JsonPatch ApplyBusStopped(JObject @event);
    }
}
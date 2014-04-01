using System;
using System.Collections.Generic;
using System.Reflection;
using log4net;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper.Old
{
    public abstract class ReadModel2
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        protected ReadModel2()
        {
            Changes = new List<Change>();
        }

        public long Version { get; private set; }
        public List<Change> Changes { get; private set; }

        public void LoadFromHistory(IEnumerable<Tuple<long, JObject>> @events)
        {
            foreach (var @event in events)
            {
                Changes.Add(Apply(@event.Item1, @event.Item2));
            }
        }

        public Change Apply(long sequence, JObject @event)
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

        public abstract Change ApplyBusStarted(JObject @event);
        public abstract Change ApplyMessageReceived(JObject @event);
        public abstract Change ApplyMessageHandled(JObject @event);
        public abstract Change ApplyHeartbeat(JObject @event);
        public abstract Change ApplyBusStopped(JObject @event);
    }
}
using System.Collections.Concurrent;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Messages;

namespace Rebus.FleetKeeper.Eventing
{
    public class Sorter : IEventEater<JObject>
    {
        static long nextVersion = 1;
        static readonly ConcurrentDictionary<long, JObject> buffer = new ConcurrentDictionary<long, JObject>();

        readonly IEventEater<JObject> eater;

        public Sorter(IEventEater<JObject> eater)
        {
            this.eater = eater;
        }

        public void Apply(JObject @event)
        {
            var version = @event.Value<long>("Version");

            if (version == nextVersion)
            {
                eater.Apply(@event);
                nextVersion++;
                JObject nextEvent;
                while (buffer.TryRemove(nextVersion, out nextEvent))
                {
                    eater.Apply(@event);
                    nextVersion++;
                }
            }
            else
            {
                buffer.TryAdd(version, @event);
            }
        }
    }

    public class Deserializer : IEventEater<JObject>
    {
        public void Apply(JObject @event)
        {
            //if (false)
            //{
            //    yield return new BusStarted()
            //    {

            //    };
            //}

            //return @event;
        }
    }


    public class Compensator : IEventEater<JObject>
    {
        List<Event> events;
        
        public Compensator()
        {
            events = new List<Event>();
        }

        public void Apply(BusStarted @event)
        {

        }

        public IEnumerable<Event> Apply(BusStopped @event)
        {
            if (false)
            {
                yield return new BusStarted()
                {

                };
            }

            yield return @event;
        }

        public void Apply(JObject @event)
        {
            throw new System.NotImplementedException();
        }
    }
}
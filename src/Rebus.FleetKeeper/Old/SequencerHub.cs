using System.Collections.Concurrent;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper.Http
{
    public interface IListener
    {
        void Handle(JObject @event);
    }

    public class SequencerHub
    {
        readonly IListener[] listeners;
        
        static object locker = new object();
        static long nextVersion = 1;
        static ConcurrentDictionary<long, JObject> buffer = new ConcurrentDictionary<long, JObject>(); 

        public SequencerHub(params IListener[] listeners)
        {
            this.listeners = listeners;
        }

        public void Receive(JObject @event)
        {
            lock (locker)
            {
                var version = @event.Value<long>("Version");

                if (version == nextVersion)
                {
                    foreach (var listener in listeners)
                        listener.Handle(@event);

                    nextVersion++;
                    JObject nextEvent;
                    while (buffer.TryRemove(nextVersion, out nextEvent))
                    {
                        foreach (var listener in listeners)
                            listener.Handle(nextEvent);

                        nextVersion++;
                    }
                }
                else
                {
                    buffer.TryAdd(version, @event);
                }
            }
        }
    }
}
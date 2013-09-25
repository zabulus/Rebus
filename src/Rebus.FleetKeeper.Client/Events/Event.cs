using System;

namespace Rebus.FleetKeeper.Client.Events
{
    public abstract class Event
    {
        protected Event()
        {
            Name = GetType().Name;
            Id = Guid.NewGuid();
            Timestamp = DateTimeOffset.Now;
        }

        public string Name { get; set; }
        public Guid Id { get; set; }
        public Guid BusClientId { get; set; }
        public string Endpoint { get; set; }
        public DateTimeOffset Timestamp { get; set; }
        public int SchemaVersion { get; set; }
    }
}
using System;

namespace Rebus.FleetKeeper.Messages
{
    public abstract class Event
    {
        protected Event()
        {
            Id = Guid.NewGuid();
            Name = GetType().Name;
            Timestamp = DateTimeOffset.Now;
        }

        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public DateTimeOffset Timestamp { get; private set; }
        public int SchemaVersion { get; protected set; }
        public Guid BusClientId { get; set; }
        public string Endpoint { get; set; }
        public string ProcessName { get; set; }
        public int Version { get; set; }
    }
}
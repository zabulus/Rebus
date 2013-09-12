using System;

namespace Rebus.FleetKeeper.Client.Events
{
    public abstract class Event
    {
        protected Event(Guid busId)
        {
            SourceBusId = busId;

            Id = Guid.NewGuid();
            Timestamp = DateTimeOffset.UtcNow;
        }

        public Guid Id { get; set; }
        public Guid SourceBusId { get; set; }
        public DateTimeOffset Timestamp { get; set; }
        public abstract int ContractVersion { get; }

        public string Name
        {
            get { return GetType().Name; }
        }
    }
}
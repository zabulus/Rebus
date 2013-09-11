using System;

namespace Rebus.FleetKeeper.Client.Messages
{
    public class BusStarted
    {
        public Guid BusId { get; set; }
    }
}
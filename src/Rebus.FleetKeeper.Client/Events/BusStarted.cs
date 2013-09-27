using System;

namespace Rebus.FleetKeeper.Client.Events
{
    public class BusStarted : Event
    {
        public BusStarted()
        {
            SchemaVersion = 1;
        }
    }
}
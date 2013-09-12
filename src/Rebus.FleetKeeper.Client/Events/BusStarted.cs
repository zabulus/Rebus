using System;

namespace Rebus.FleetKeeper.Client.Events
{
    public class BusStarted : Event
    {
        public BusStarted(Guid busId) : base(busId) {}

        public override int ContractVersion
        {
            get { return 1; }
        }
    }

    public class BusStopped : Event
    {
        public BusStopped(Guid busId) : base(busId) {}

        public override int ContractVersion
        {
            get { return 1; }
        }
    }
}
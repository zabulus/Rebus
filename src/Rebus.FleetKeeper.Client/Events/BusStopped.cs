namespace Rebus.FleetKeeper.Client.Events
{
    public class BusStopped : Event
    {
        public BusStopped()
        {
            SchemaVersion = 1;
        }
    }
}
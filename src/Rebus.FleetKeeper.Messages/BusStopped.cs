namespace Rebus.FleetKeeper.Messages
{
    public class BusStopped : Event
    {
        public BusStopped()
        {
            SchemaVersion = 1;
        }
    }
}
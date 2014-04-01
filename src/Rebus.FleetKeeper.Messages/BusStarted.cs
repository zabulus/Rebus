namespace Rebus.FleetKeeper.Messages
{
    public class BusStarted : Event
    {
        public BusStarted()
        {
            SchemaVersion = 1;
        }
    }
}
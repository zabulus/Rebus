namespace Rebus.FleetKeeper.Client.Events
{
    public class HeartBeat : Event
    {
        public HeartBeat()
        {
            SchemaVersion = 1;
        }
    }
}
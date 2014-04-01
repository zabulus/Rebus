namespace Rebus.FleetKeeper.Messages
{
    public class HeartBeat : Event
    {
        public HeartBeat()
        {
            SchemaVersion = 1;
        }
    }
}
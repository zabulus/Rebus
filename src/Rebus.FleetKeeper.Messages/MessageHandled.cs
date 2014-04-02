namespace Rebus.FleetKeeper.Messages
{
    public class MessageHandled : Event
    {
        public MessageHandled()
        {
            SchemaVersion = 1;
        }

        public string MessageId { get; set; }
    }
}
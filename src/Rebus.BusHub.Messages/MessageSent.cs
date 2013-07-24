namespace Rebus.BusHub.Messages
{
    public class MessageSent : BusHubMessage
    {
        public MessageSent(string messageType, string destination)
        {
            MessageType = messageType;
            Destination = destination;
        }

        public string MessageType { get; set; }
        public string Destination { get; set; }
    }
}
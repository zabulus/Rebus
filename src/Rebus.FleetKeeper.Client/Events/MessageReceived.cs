using System;

namespace Rebus.FleetKeeper.Client.Events
{
    public class MessageReceived : Event
    {
        public MessageReceived()
        {
            SchemaVersion = 1;
        }

        public string MessageId { get; set; }
        public string MessageType { get; set; }
    }
}
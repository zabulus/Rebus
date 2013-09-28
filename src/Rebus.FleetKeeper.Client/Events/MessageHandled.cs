using System;

namespace Rebus.FleetKeeper.Client.Events
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
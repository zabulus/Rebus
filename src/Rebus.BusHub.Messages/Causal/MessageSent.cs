using System;

namespace Rebus.BusHub.Messages.Causal
{
    /// <summary>
    /// Raised whenever a message is sent somewhere.
    /// </summary>
    public class MessageSent : BusHubMessage
    {
        public string MessageType { get; set; }
        public string Destination { get; set; }
        public Guid UnitOfWorkId { get; set; }
    }
}
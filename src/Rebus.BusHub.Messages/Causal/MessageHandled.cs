using System;

namespace Rebus.BusHub.Messages.Causal
{
    /// <summary>
    /// Raised after the successful handling of a message.
    /// </summary>
    public class MessageHandled : BusHubMessage
    {
        public TimeSpan Elapsed { get; set; }

        public LogicalMessageStats[] LogicalMessages { get; set; }

        public int BodyLengthBytes { get; set; }
    }

    public class LogicalMessageStats
    {
        public string MessageType { get; set; }
        public TimeSpan Elapsed { get; set; }
    }
}
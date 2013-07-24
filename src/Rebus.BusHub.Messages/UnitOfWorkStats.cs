using System;

namespace Rebus.BusHub.Messages
{
    public class UnitOfWorkStats : BusHubMessage
    {
        public TimeSpan Elapsed { get; set; }

        public LogicalMessageStats[] LogicalMessages { get; set; }

        public int BodyLengthBytes { get; set; }
    }

    public class LogicalMessageStats
    {
        public LogicalMessageStats(string messageType, TimeSpan elapsed)
        {
            MessageType = messageType;
            Elapsed = elapsed;
        }

        public string MessageType { get; set; }
        public TimeSpan Elapsed { get; set; }
    }
}
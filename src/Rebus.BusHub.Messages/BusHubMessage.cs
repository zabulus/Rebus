using System;

namespace Rebus.BusHub.Messages
{
    public abstract class BusHubMessage
    {
        protected BusHubMessage()
        {
            ClientTimeUtc = DateTime.UtcNow;
        }

        public DateTime ClientTimeUtc { get; set; }

        public string ClientId { get; set; }
    }
}
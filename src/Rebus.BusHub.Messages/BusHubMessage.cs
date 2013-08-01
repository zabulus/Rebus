using System;

namespace Rebus.BusHub.Messages
{
    /// <summary>
    /// Base message to the bus hub that has an initialized current time of the client and will be
    /// supplied with a client ID when the message is sent.
    /// </summary>
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
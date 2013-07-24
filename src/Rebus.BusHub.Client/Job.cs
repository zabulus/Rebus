using System;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client
{
    public abstract class Job
    {
        public abstract void Initialize(IRebusEvents events, IBusHubClient client);

        public event Action<BusHubMessage> MessageSent = delegate { };

        protected void SendMessage(BusHubMessage busHubMessage)
        {
            MessageSent(busHubMessage);
        }
    }
}
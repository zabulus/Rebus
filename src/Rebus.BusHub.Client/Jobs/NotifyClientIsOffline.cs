using Rebus.BusHub.Messages;
using Rebus.BusHub.Messages.Causal;

namespace Rebus.BusHub.Client.Jobs
{
    public class NotifyClientIsOffline : Job
    {
        public override void Initialize(IRebusEvents events, IBusHubClient client)
        {
            // we could have used events.BusStopped for this, but then we would risk that the client was disposed before us
            // ... therefore:
            client.BeforeDispose += () => SendMessage(new BusHasBeenStopped());
        }
    }
}
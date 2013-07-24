using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client.Jobs
{
    public class NotifyClientIsOffline : Job
    {
        public override void Initialize(IRebusEvents events, BusHubClient busHubClient)
        {
            // we could have used events.BusStopped for this, but then we would risk that the client was disposed before us
            // ... therefore:
            busHubClient.BeforeDispose += () => SendMessage(new ClientIsOffline());
        }
    }
}
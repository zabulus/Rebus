using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client.Jobs
{
    public class NotifyClientIsOnline : Job
    {
        public override void Initialize(IRebusEvents events, BusHubClient busHubClient)
        {
            SendMessage(new ClientIsOnline(busHubClient.InputQueueAddress));
        }
    }
}
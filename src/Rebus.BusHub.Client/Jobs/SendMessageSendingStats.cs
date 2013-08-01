using Rebus.BusHub.Client.Jobs.Stats;
using Rebus.BusHub.Messages.Causal;

namespace Rebus.BusHub.Client.Jobs
{
    public class SendMessageSendingStats : Job
    {
        public override void Initialize(IRebusEvents events, IBusHubClient client)
        {
            events.MessageSent += OnMessageSent;
        }

        void OnMessageSent(IBus bus, string destination, object message)
        {
            var busHubMessage =
                new MessageSent
                    {
                        MessageType = message.GetType().FullName,
                        Destination = destination,
                    };

            // if we're not in a message handler, we just send the event right away
            if (!MessageContext.HasCurrent)
            {
                SendMessage(busHubMessage);
                return;
            }

            // otherwise, put the sent message info inside the current stats colletor
            var messageContext = MessageContext.GetCurrent();
            var uow = (StatsCollectingUnitOfWork)messageContext.Items[StatsCollectingUnitOfWork.Key];
            uow.MessageWasSent(busHubMessage);
        }
    }
}
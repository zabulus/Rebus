using System;
using System.Collections.Generic;
using Rebus.Bus;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client.Jobs
{
    public class SendMessageSendingStats : Job, IUnitOfWorkManager
    {
        const string StatsKey = "SendMessageSendingStats-uow";

        public override void Initialize(IRebusEvents events, IBusHubClient client)
        {
            events.AddUnitOfWorkManager(this);
            events.MessageSent += OnMessageSent;
        }

        public IUnitOfWork Create()
        {
            var uow = new StatsCollectingUnitOfWork();
            uow.Committed += () => uow.SentMessages.ForEach(SendMessage);
            var messageContext = MessageContext.GetCurrent();
            messageContext.Items[StatsKey] = uow;
            return uow;
        }

        void OnMessageSent(IBus bus, string destination, object message)
        {
            var busHubMessage = new MessageSent(message.GetType().FullName, destination);

            if (!MessageContext.HasCurrent)
            {
                SendMessage(busHubMessage);
                return;
            }

            var messageContext = MessageContext.GetCurrent();
            var uow = (StatsCollectingUnitOfWork)messageContext.Items[StatsKey];
            uow.Add(busHubMessage);
        }

        class StatsCollectingUnitOfWork : IUnitOfWork
        {
            readonly List<MessageSent> sentMessages = new List<MessageSent>();

            public event Action Committed = delegate { };

            public List<MessageSent> SentMessages
            {
                get { return sentMessages; }
            }

            public void Commit()
            {
                Committed();
            }

            public void Abort()
            {
            }

            public void Dispose()
            {
            }

            public void Add(MessageSent busHubMessage)
            {
                sentMessages.Add(busHubMessage);
            }
        }
    }
}
using System;
using System.Collections.Generic;
using Rebus.Bus;
using Rebus.BusHub.Messages.Causal;

namespace Rebus.BusHub.Client.Jobs.Stats
{
    public class StatsCollectingUnitOfWork : IUnitOfWork
    {
        public const string Key = "SendMessageHandlingStats-uow";

        readonly List<LogicalMessageStats> handledMessages = new List<LogicalMessageStats>();
        readonly List<MessageSent> sentMessages = new List<MessageSent>();

        DateTime currentMessageProcessingStartTime;

        public StatsCollectingUnitOfWork()
        {
            Id = Guid.NewGuid();
        }

        public Guid Id { get; set; }

        public List<LogicalMessageStats> HandledMessages
        {
            get { return handledMessages; }
        }

        public List<MessageSent> SentMessages
        {
            get { return sentMessages; }
        }

        readonly DateTime startTime = DateTime.UtcNow;

        public event Action Committed = delegate { };

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

        public TimeSpan Elapsed
        {
            get { return DateTime.UtcNow - startTime; }
        }

        public void StartHandling(object message)
        {
            currentMessageProcessingStartTime = DateTime.UtcNow;
        }

        public void MessageWasHandled(object message)
        {
            var elapsed = DateTime.UtcNow - currentMessageProcessingStartTime;
            var messageType = message.GetType().FullName;
            var stats = new LogicalMessageStats {MessageType = messageType, Elapsed = elapsed};
            handledMessages.Add(stats);
        }

        public void MessageWasSent(MessageSent messageSent)
        {
            messageSent.UnitOfWorkId = Id;
            sentMessages.Add(messageSent);
        }
    }
}
using System;
using System.Collections.Generic;
using Rebus.Bus;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client.Jobs
{
    public class SendMessageHandlingStats : Job, IUnitOfWorkManager
    {
        const string UowKey = "SendMessageHandlingStats-uow";

        /// <summary>
        /// Possibly come up with a better way to do this
        /// </summary>
        [ThreadStatic]
        static int messageBodyLength;

        public override void Initialize(IRebusEvents events, IBusHubClient client)
        {
            events.AddUnitOfWorkManager(this);
            events.BeforeMessage += BeforeMessage;
            events.AfterMessage += AfterMessage;
            events.BeforeTransportMessage += BeforeTransportMessage;
        }

        void BeforeTransportMessage(IBus bus, ReceivedTransportMessage receivedtransportmessage)
        {
            messageBodyLength = receivedtransportmessage.Body.Length;
        }

        void BeforeMessage(IBus bus, object message)
        {
            var messageContext = MessageContext.GetCurrent();
            var uow = (StatsCollectingUnitOfWork)messageContext.Items[UowKey];
            uow.StartHandling(message);
        }

        void AfterMessage(IBus bus, Exception exception, object message)
        {
            if (exception != null) return;

            var messageContext = MessageContext.GetCurrent();
            var uow = (StatsCollectingUnitOfWork)messageContext.Items[UowKey];
            uow.MessageWasHandled(message);
        }

        public IUnitOfWork Create()
        {
            var uow = new StatsCollectingUnitOfWork();
            
            uow.Committed +=
                () =>
                    {
                        SendMessage(new UnitOfWorkStats
                                        {
                                            Elapsed = uow.Elapsed,
                                            LogicalMessages = uow.Messages.ToArray(),
                                            BodyLengthBytes = messageBodyLength
                                        });

                        messageBodyLength = 0;
                    };

            var messageContext = MessageContext.GetCurrent();
            messageContext.Items[UowKey] = uow;
            return uow;
        }
    }

    public class StatsCollectingUnitOfWork : IUnitOfWork
    {
        readonly List<LogicalMessageStats> messages = new List<LogicalMessageStats>();

        DateTime currentMessageProcessingStartTime;

        public List<LogicalMessageStats> Messages
        {
            get { return messages; }
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
            var stats = new LogicalMessageStats(messageType, elapsed);
            messages.Add(stats);
        }

        public void SetBodyLength(int length)
        {
            BodyLength = length;
        }

        public int BodyLength { get; set; }
    }
}
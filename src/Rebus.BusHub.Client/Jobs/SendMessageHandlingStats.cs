using System;
using System.Collections.Generic;
using Rebus.Bus;
using Rebus.BusHub.Messages;
using System.Linq;

namespace Rebus.BusHub.Client.Jobs
{
    public class SendMessageHandlingStats : Job, IUnitOfWorkManager
    {
        const string UowKey = "current-bushub-stats-uow";

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
                                            LogicalMessages = uow.Messages
                                                                 .Select(m => new LogicalMessageStats
                                                                                  {
                                                                                      Elapsed = m.Elapsed,
                                                                                      MessageType = m.MessageType
                                                                                  })
                                                                 .ToArray(),
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
        readonly List<LogicalMessageInfo> messages = new List<LogicalMessageInfo>();

        public class LogicalMessageInfo
        {
            public string MessageType { get; set; }
            public TimeSpan Elapsed { get; set; }
        }

        DateTime currentMessageProcessingStartTime;

        public List<LogicalMessageInfo> Messages
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
            messages.Add(new LogicalMessageInfo
                             {
                                 Elapsed = DateTime.UtcNow - currentMessageProcessingStartTime,
                                 MessageType = message.GetType().FullName,
                             });
        }

        public void SetBodyLength(int length)
        {
            BodyLength = length;
        }

        public int BodyLength { get; set; }
    }
}
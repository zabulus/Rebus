using System;
using Rebus.Bus;
using Rebus.BusHub.Client.Jobs.Stats;
using Rebus.BusHub.Messages.Causal;

namespace Rebus.BusHub.Client.Jobs
{
    public class SendMessageHandlingStats : Job, IUnitOfWorkManager
    {
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
            var uow = (StatsCollectingUnitOfWork)messageContext.Items[StatsCollectingUnitOfWork.Key];
            uow.StartHandling(message);
        }

        void AfterMessage(IBus bus, Exception exception, object message)
        {
            if (exception != null) return;

            var messageContext = MessageContext.GetCurrent();
            var uow = (StatsCollectingUnitOfWork)messageContext.Items[StatsCollectingUnitOfWork.Key];
            uow.MessageWasHandled(message);
        }

        public IUnitOfWork Create()
        {
            var uow = new StatsCollectingUnitOfWork();
            
            uow.Committed +=
                () =>
                    {
                        SendMessage(new MessageHandled
                                        {
                                            Elapsed = uow.Elapsed,
                                            LogicalMessages = uow.HandledMessages.ToArray(),
                                            BodyLengthBytes = messageBodyLength
                                        });

                        uow.SentMessages.ForEach(SendMessage);

                        messageBodyLength = 0;
                    };

            var messageContext = MessageContext.GetCurrent();
            messageContext.Items[StatsCollectingUnitOfWork.Key] = uow;
            return uow;
        }
    }
}
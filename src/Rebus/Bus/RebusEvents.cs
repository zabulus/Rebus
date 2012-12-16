using System;
using System.Collections.Generic;

namespace Rebus.Bus
{
    class RebusEvents : IRebusEvents
    {
        public RebusEvents()
        {
            MessageMutators = new List<IMutateMessages>();
        }

        public event BusStartedEventHandler BusStarted = delegate { };

        public event MessageSentEventHandler MessageSent = delegate { };

        public event BeforeMessageEventHandler BeforeMessage = delegate { };

        public event AfterMessageEventHandler AfterMessage = delegate { };

        public event UncorrelatedMessageEventHandler UncorrelatedMessage = delegate { };

        public event MessageContextEstablishedEventHandler MessageContextEstablished = delegate { };

        public event BeforeTransportMessageEventHandler BeforeTransportMessage = delegate { };

        public event AfterTransportMessageEventHandler AfterTransportMessage = delegate { };

        public event PoisonMessageEventHandler PoisonMessage = delegate { };

        public ICollection<IMutateMessages> MessageMutators { get; private set; }

        internal void RaiseBusStarted(IBus bus)
        {
            BusStarted(bus);
        }

        internal void RaiseMessageContextEstablished(IBus advancedBus, IMessageContext messageContext)
        {
            MessageContextEstablished(advancedBus, messageContext);
        }

        internal void RaiseMessageSent(IBus advancedBus, string destination, object message)
        {
            MessageSent(advancedBus, destination, message);
        }

        internal void RaiseBeforeMessage(IBus advancedBus, object message)
        {
            BeforeMessage(advancedBus, message);
        }

        internal void RaiseAfterMessage(IBus bus, Exception exception, object message)
        {
            AfterMessage(bus, exception, message);
        }

        internal void RaiseBeforeTransportMessage(IBus advancedBus, ReceivedTransportMessage transportMessage)
        {
            BeforeTransportMessage(advancedBus, transportMessage);
        }

        internal void RaiseAfterTransportMessage(IBus advancedBus, Exception exception, ReceivedTransportMessage transportMessage)
        {
            AfterTransportMessage(advancedBus, exception, transportMessage);
        }

        internal void RaisePoisonMessage(IBus advancedBus, ReceivedTransportMessage transportMessage, PoisonMessageInfo poisonMessageInfo)
        {
            PoisonMessage(advancedBus, transportMessage, poisonMessageInfo);
        }

        internal void RaiseUncorrelatedMessage(IBus advancedBus, object message, Saga saga)
        {
            UncorrelatedMessage(advancedBus, message, saga);
        }
    }
}
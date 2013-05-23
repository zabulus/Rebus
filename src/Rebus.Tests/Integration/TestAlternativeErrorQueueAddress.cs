using System;
using System.Messaging;
using NUnit.Framework;
using Rebus.Configuration;
using Rebus.Logging;
using Rebus.Serialization.Json;
using Rebus.Transports.Msmq;
using Message = Rebus.Messages.Message;
using Shouldly;

namespace Rebus.Tests.Integration
{
    [TestFixture]
    public class TestAlternativeErrorQueueAddress : RebusBusMsmqIntegrationTestBase
    {
        MessageQueue defaultErrorQueue;
        MessageQueue alternativeErrorQueue;
        HandlerActivatorForTesting everThrowingHandlerActivator;
        const string InputQueueName = "test.altenative.input";
        const string DefaultErrorQueueName = "test.altenative.error1";
        const string AlternativeErrorQueueName = "test.altenative.error2";

        protected override void DoSetUp()
        {
            RebusLoggerFactory.Current = new ConsoleLoggerFactory(false) { MinLevel = LogLevel.Warn };
            base.DoSetUp();

            defaultErrorQueue = GetMessageQueue(DefaultErrorQueueName);
            alternativeErrorQueue = GetMessageQueue(AlternativeErrorQueueName);

            everThrowingHandlerActivator = new HandlerActivatorForTesting().Handle<object>(JustThrow);
        }

        [Test]
        public void UsesDefaultErrorQueueWhenNullIsReturned()
        {
            using (var bus = Configure
                .With(new FakeContainerAdapter(everThrowingHandlerActivator))
                .Transport(t => t.UseMsmq(InputQueueName, DefaultErrorQueueName))
                .Behavior(b => b.UseAlternativeErrorQueueAddress(msg => null))
                .CreateBus()
                .Start())
            {
                bus.SendLocal("whatever - it will fail anyway");

                var messageFromDefaultErrorQueue = ReceiveFrom(defaultErrorQueue);
                var messageFromAlternativeErrorQueue = ReceiveFrom(alternativeErrorQueue);

                messageFromDefaultErrorQueue.ShouldNotBe(null);
                messageFromDefaultErrorQueue.Messages.Length.ShouldBe(1);
                messageFromDefaultErrorQueue.Messages[0].ShouldBe("whatever - it will fail anyway");
                
                messageFromAlternativeErrorQueue.ShouldBe(null);
            }
        }

        [Test]
        public void CanUseSpecifiedAlternativeErrorQueue()
        {
            using (var bus = Configure
                .With(new FakeContainerAdapter(everThrowingHandlerActivator))
                .Transport(t => t.UseMsmq(InputQueueName, DefaultErrorQueueName))
                .Behavior(b => b.UseAlternativeErrorQueueAddress(msg => AlternativeErrorQueueName))
                .CreateBus()
                .Start())
            {
                bus.SendLocal("whatever - it will fail anyway");

                var messageFromDefaultErrorQueue = ReceiveFrom(defaultErrorQueue);
                var messageFromAlternativeErrorQueue = ReceiveFrom(alternativeErrorQueue);

                messageFromDefaultErrorQueue.ShouldBe(null);

                messageFromAlternativeErrorQueue.ShouldNotBe(null);
                messageFromAlternativeErrorQueue.Messages.Length.ShouldBe(1);
                messageFromAlternativeErrorQueue.Messages[0].ShouldBe("whatever - it will fail anyway");
            }
        }

        void JustThrow(object obj)
        {
            throw new InvalidOperationException("w00tadafook!!!1");
        }

        Message ReceiveFrom(MessageQueue queue)
        {
            try
            {
                var transportMessage = (ReceivedTransportMessage) queue.Receive(TimeSpan.FromSeconds(2)).Body;
                var message = new JsonMessageSerializer().Deserialize(transportMessage);
                return message;
            }
            catch
            {
                return null;
            }
        }

        MessageQueue GetMessageQueue(string queueName)
        {
            return GetMessageQueueFromPath(PrivateQueueNamed(queueName));
        }

        MessageQueue GetMessageQueueFromPath(string queuePath)
        {
            try
            {
                EnsureQueueExists(queuePath);
            }
            catch { }
            var queue = new MessageQueue(queuePath)
            {
                MessageReadPropertyFilter = RebusTransportMessageFormatter.PropertyFilter,
                Formatter = new RebusTransportMessageFormatter(),
            };
            queue.Purge();
            return queue;
        }
    }
}
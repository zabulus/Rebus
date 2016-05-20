﻿using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Rebus.Activation;
using Rebus.Bus;
using Rebus.Config;
using Rebus.DataBus;
using Rebus.DataBus.InMem;
using Rebus.Routing.TypeBased;
using Rebus.Tests.Extensions;
using Rebus.Transport.InMem;

namespace Rebus.Tests.DataBus
{
    [TestFixture]
    public class SimpleTest : FixtureBase
    {
        InMemNetwork _inMemNetwork;
        IBus _senderBus;
        BuiltinHandlerActivator _receiverActivator;
        InMemDataStore _inMemDataStore;

        protected override void SetUp()
        {
            _inMemNetwork = new InMemNetwork();
            _inMemDataStore = new InMemDataStore();

            _senderBus = StartBus("sender").Bus;
            _receiverActivator = StartBus("receiver");
        }

        BuiltinHandlerActivator StartBus(string queueName)
        {
            var activator = Using(new BuiltinHandlerActivator());

            Configure.With(activator)
                .Transport(t => t.UseInMemoryTransport(_inMemNetwork, queueName))
                .Routing(r => r.TypeBased().Map<MessageWithAttachment>("receiver"))
                .Options(o =>
                {
                    o.EnableDataBus().StoreInMemory(_inMemDataStore);
                })
                .Start();

            return activator;
        }

        [Test]
        public async Task CanSendBigFile()
        {
            var sourceFilePath = GetTempFilePath();
            var destinationFilePath = GetTempFilePath();

            const string originalFileContents = "THIS IS A BIG FILE!!";

            File.WriteAllText(sourceFilePath, originalFileContents);

            var dataSuccessfullyCopied = new ManualResetEvent(false);

            // set up handler that writes the contents of the received attachment to a file
            _receiverActivator.Handle<MessageWithAttachment>(async message =>
            {
                var attachment = message.Attachment;

                using (var destination = File.OpenWrite(destinationFilePath))
                {
                    await attachment.OpenRead().CopyToAsync(destination);
                }

                dataSuccessfullyCopied.Set();
            });

            // send a message that sends the contents of a file as an attachment
            using (var source = File.OpenRead(sourceFilePath))
            {
                var attachment = await _senderBus.Advanced.DataBus.CreateAttachment(source);

                await _senderBus.Send(new MessageWithAttachment
                {
                    Attachment = attachment
                });
            }

            dataSuccessfullyCopied.WaitOrDie(TimeSpan.FromSeconds(5), "Data was not successfully copied within 5 second timeout");

            Assert.That(File.ReadAllText(destinationFilePath), Is.EqualTo(originalFileContents));
        }

        class MessageWithAttachment
        {
            public DataBusAttachment Attachment { get; set; }
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Autofac;
using NUnit.Framework;
using Rebus.Autofac;
using Rebus.Bus;
using Rebus.Configuration;
using Rebus.Shared;
using Rebus.Transports.Msmq;
using Rebus.Logging;
using Shouldly;

namespace Rebus.Tests.Bugs
{
    [TestFixture]
    public class AutofacIntegrationIsSuperSmooth : FixtureBase
    {
        const string InputQueueName = "test.input";
        const string ErrorQueueName = "error";
        readonly List<IDisposable> stuffToDispose = new List<IDisposable>();
        RebusBus bus;
        List<string> events;

        protected override void DoSetUp()
        {
            var builder = new ContainerBuilder();
            events = new List<string>();

            // make sure we get published events from the handler
            StringHandlerWithStatics.ClearEventHandlers();
            StringHandlerWithStatics.Publish += e => events.Add(e);

            builder.RegisterType<StringHandlerWithStatics>()
                   .As<IHandleMessages<string>>();

            var container = builder.Build();

            bus = (RebusBus) Configure.With(new AutofacContainerAdapter(container))
                                      .Logging(l => l.ColoredConsole(LogLevel.Warn))
                                      .Transport(t => t.UseMsmq(InputQueueName, ErrorQueueName))
                                      .CreateBus();

            bus.Start(1);

            stuffToDispose.Add(container);
        }

        protected override void DoTearDown()
        {
            stuffToDispose.ForEach(d => d.Dispose());

            MsmqUtil.Delete(InputQueueName);
            MsmqUtil.Delete(ErrorQueueName);
        }

        [TestCase(10)]
        [TestCase(12)]
        [TestCase(14)]
        [TestCase(100, Ignore = TestCategories.IgnoreLongRunningTests)]
        [TestCase(1000, Ignore = TestCategories.IgnoreLongRunningTests)]
        public void ItsSmooth(int numberOfMessages)
        {
            var counter = 1;
            numberOfMessages.Times(() => bus.SendLocal("msg # " + counter++));

            Thread.Sleep(2.Seconds() + (numberOfMessages*0.01).Seconds());

            Console.WriteLine(@"Got events:
{0}", string.Join(Environment.NewLine, events));

            // expect strict ordering of events - no overlap!
            var expectedEvents = Enumerable
                .Repeat(new[] {"created", "message handled", "disposed"}, numberOfMessages)
                .SelectMany(t => t)
                .ToList();

            events.ShouldBe(expectedEvents);
        }
    }

    public class StringHandlerWithStatics : IHandleMessages<string>, IDisposable
    {
        public static event Action<string> Publish = delegate { }; 

        public StringHandlerWithStatics()
        {
            Publish("created");
        }

        public void Handle(string message)
        {
            Publish("message handled");
        }

        public void Dispose()
        {
            Publish("disposed");
        }

        public static void ClearEventHandlers()
        {
            Publish = delegate { };
        }
    }
}
using System;
using System.Collections.Generic;
using System.Reflection;
using NUnit.Framework;
using Rebus.BusHub.Client;
using Rebus.BusHub.Client.Jobs;
using Rebus.BusHub.Messages;
using Shouldly;
using System.Linq;
using Rhino.Mocks;

namespace Rebus.BusHub.Tests.Jobs
{
    [TestFixture]
    public class TestNotifyClientIsOnline : FixtureFor<NotifyClientIsOnline>
    {
        readonly List<BusHubMessage> messages = new List<BusHubMessage>();

        protected override NotifyClientIsOnline SetUpInstance()
        {
            var job = new NotifyClientIsOnline();
            job.MessageSent += message => messages.Add(message);
            return job;
        }

        [Test, Description("Hard to test right because the entry assembly is ")]
        public void GetsItRight()
        {
            // act
            var busHubClient = Mock<IBusHubClient>();
            var testAssemblyJustForTesting = Assembly.GetExecutingAssembly();
            busHubClient.Stub(c => c.GetEntryAssembly()).Return(testAssemblyJustForTesting);

            instance.Initialize(Mock<IRebusEvents>(), busHubClient);

            // assert
            messages.Count.ShouldBe(1);
            messages.Single().ShouldBeTypeOf<ClientIsOnline>();
            
            var message = (ClientIsOnline) messages.Single();

            // this one varies depending on how the tests are run
            //message.FileName.ShouldContain("n/a");
            //message.FileName.ShouldContain("JetBrains.ReSharper.TaskRunner.CLR4.MSIL");
            message.LoadedAssemblies
                   .ShouldContain(a => a.Version.Contains("1.0.0.1")
                                       && a.Location.Contains("Rebus.BusHub.Tests")
                                       && a.Codebase.Contains("Rebus.BusHub.Tests"));
        }
    }
}
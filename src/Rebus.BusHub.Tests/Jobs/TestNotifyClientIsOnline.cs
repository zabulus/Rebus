using System.Collections.Generic;
using NUnit.Framework;
using Rebus.BusHub.Client;
using Rebus.BusHub.Client.Jobs;
using Rebus.BusHub.Messages;
using Shouldly;
using System.Linq;

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

        [Test]
        public void GetsItRight()
        {
            // act
            instance.Initialize(Mock<IRebusEvents>(), Mock<IBusHubClient>());

            // assert
            messages.Count.ShouldBe(1);
            messages.Single().ShouldBeTypeOf<ClientIsOnline>();
            
            var message = (ClientIsOnline) messages.Single();

            message.FileName.ShouldContain("n/a");
            message.EntryPointAssemblyVersion.ShouldContain("n/a");
            message.ExecutablePath.ShouldContain("n/a");
            message.CodebasePath.ShouldContain("n/a");
        }
    }
}
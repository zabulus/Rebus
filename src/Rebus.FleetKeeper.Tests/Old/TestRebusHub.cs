using System.Linq;
using Microsoft.Reactive.Testing;
using NUnit.Framework;
using Rebus.FleetKeeper.Http;
using Rebus.FleetKeeper.Messages;
using Shouldly;

namespace Rebus.FleetKeeper.Tests.Old
{
    public class TestRebusHub
    {
        [Test]
        public void Test()
        {
            var scheduler = new TestScheduler();
            var observer = scheduler.CreateObserver<Event>();
            var hub = new RebusHub(observer);
            var message = new BusStarted();
            
            hub.Receive(message);

            observer.Messages.Single().Value.Value.ShouldBe(message);
        }
    }
}
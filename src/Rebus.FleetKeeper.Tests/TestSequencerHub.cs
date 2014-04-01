using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using Rebus.FleetKeeper.Http;
using Shouldly;

namespace Rebus.FleetKeeper.Tests
{
    public class TestSequencerHub
    {
        [Test]
        public void InvokesListenersOnReceive()
        {
            var listener = new TestListener();
            var hub = new SequencerHub(listener);
            var message = JObject.FromObject(new { Version = 1, Content = "somenicething" });
            hub.Receive(message);
            listener.Events.Single().ShouldBe(message);
        }

        [Test]
        public void ReordersOutOfOrderEventsByVersion()
        {
            var listener = new TestListener();
            var hub = new SequencerHub(listener);
            hub.Receive(JObject.FromObject(new { Version = 2 }));
            hub.Receive(JObject.FromObject(new { Version = 3 }));
            hub.Receive(JObject.FromObject(new { Version = 1 }));
            
            listener.Events.Select(x => x.Value<int>("Version")).ShouldBe(new[] { 1, 2, 3 });
        }

        [Test]
        public void ReordersParallelEvents()
        {
            var listener = new TestListener();
            var hub = new SequencerHub(listener);

            Parallel.For(1, 100, i => hub.Receive(JObject.FromObject(new { Version = i })));
            
            listener.Events.Select(x => x.Value<int>("Version"))
                    .ShouldBe(Enumerable.Range(1, 99));
        }
    }
}
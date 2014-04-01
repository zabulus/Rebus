using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using Rebus.Bus;
using Rebus.FleetKeeper.Eventing;
using Rebus.FleetKeeper.Messages;
using Shouldly;

namespace Rebus.FleetKeeper.Tests
{
    public class TestRebusHub
    {
        [Test]
        public void ReceivesEvents()
        {
            var events = new List<Event>();
            RebusHub.Events.Subscribe(events.Add);
            
            var @event = new BusStarted { Version = 1 };
            new RebusHub().Receive(@event);
            
            events.Single().ShouldBe(@event);
        }

        [Test]
        public void HandlesMultipleSubscriptions()
        {
            var events = new List<Event>();
            RebusHub.Events.Subscribe(events.Add);
            RebusHub.Events.Subscribe(events.Add);
            
            var @event = new BusStarted { Version = 1 };
            
            new RebusHub().Receive(@event);
            
            events.Count.ShouldBe(2);
        }

        [Test]
        public void TimesOutOnUnexpectedSequenceNumber()
        {
            var events = new List<Event>();
            RebusHub.Events.Subscribe(events.Add, onError: Console.WriteLine);
            
            var @event = new BusStarted { Version = 20 };
            
            new RebusHub().Receive(@event);
            
            Thread.Sleep(2000);

            events.Single().ShouldBe(@event);
        }

        [Test]
        public void ReordersOutOfOrderEventsByVersion()
        {
            var events = new List<Event>();
            RebusHub.Events.Subscribe(events.Add);
            new RebusHub().Receive(new BusStarted { Version = 2 });
            new RebusHub().Receive(new BusStarted { Version = 3 });
            new RebusHub().Receive(new BusStarted { Version = 1 });

            events.Select(x => x.Version).ShouldBe(new[] { 1, 2, 3 });
        }

        [Test]
        public void ReordersParallelEvents()
        {
            var events = new List<Event>();
            RebusHub.Events.Subscribe(events.Add);

            Parallel.For(1, 1000, i => new RebusHub().Receive(new BusStarted { Version = i }));

            events.Select(x => x.Version).ShouldBe(Enumerable.Range(1, 999));
        }
    }
}
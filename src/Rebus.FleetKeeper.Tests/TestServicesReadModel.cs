using System;
using System.Linq;
using NUnit.Framework;
using Rebus.FleetKeeper.Eventing;
using Rebus.FleetKeeper.Messages;
using Shouldly;

namespace Rebus.FleetKeeper.Tests
{
    public class TestServicesReadModel : ReadModelTestBase<ServicesReadModel>
    {
        [Test]
        public void AddsStartedBus()
        {
            var @event = new BusStarted
            {
                BusClientId = Guid.NewGuid(),
                Endpoint = "SomeWhere",
                ProcessName = "SomeThing",
            };

            model.Apply(@event);

            var service = model.Services.Single();
            service.BusClientId.ShouldBe(@event.BusClientId);
            service.Endpoint.ShouldBe(@event.Endpoint);
            service.ProcessName.ShouldBe(@event.ProcessName);
            service.LastLifeSign.ShouldBe(@event.Timestamp);
            service.IsStarted.ShouldBe(true);
        }

        [Test]
        public void DeactivatesStoppedBus()
        {
            var busClientId = Guid.NewGuid();
            model.Apply(new BusStarted { BusClientId = busClientId });
            model.Apply(new BusStopped { BusClientId = busClientId });

            var service = model.Services.Single();
            service.IsStarted.ShouldBe(false);
        }

        [Test]
        public void RestartsExistingStoppedBus()
        {
            var busClientId = Guid.NewGuid();
            model.Apply(new BusStarted { BusClientId = busClientId });
            model.Apply(new BusStopped { BusClientId = busClientId });
            model.Apply(new BusStarted { BusClientId = busClientId });

            var service = model.Services.Single();
            service.IsStarted.ShouldBe(true);
        }

        [Test]
        public void CompensatesForMissingBusStartedOnStoppedBus()
        {
            var @event = new BusStopped
            {
                BusClientId = Guid.NewGuid(),
                Endpoint = "SomeWhere",
                ProcessName = "SomeThing",
            };

            model.Apply(@event);

            var service = model.Services.Single();
            service.BusClientId.ShouldBe(@event.BusClientId);
            service.Endpoint.ShouldBe(@event.Endpoint);
            service.ProcessName.ShouldBe(@event.ProcessName);
            service.LastLifeSign.ShouldBe(@event.Timestamp);
            service.IsStarted.ShouldBe(false);
        }

        [Test]
        public void CompensatesForMissingBusStartedOnMessageReceived()
        {
            model.Apply(new MessageReceived { BusClientId = Guid.NewGuid() });
        }
    }
}
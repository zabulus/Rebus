using System;
using NUnit.Framework;
using Rebus.Configuration;
using Rebus.FleetKeeper.Client;
using Rebus.FleetKeeper.Client.Events;
using Shouldly;

namespace Rebus.Tests.FleetKeeper
{
    public class TestFleetKeeperClient
    {
        [Test]
        public void Test()
        {
            Configure.With(new BuiltinContainerAdapter())
                .Logging(x => { })
                .EnableFleetKeeper("http://localhost:8080");
        }
    }

    public class TestFleetKeeperEventContracts
    {
        [Test]
        public void BusStartedHasContract()
        {
            // Must not be renamed
            new BusStarted(Guid.NewGuid()).Name.ShouldBe("B" + "usStarted");

            // Must have required properties
            typeof (BusStarted).GetProperty("C" + "ontractVersion", typeof(int)).ShouldNotBe(null);
        }
    }
}
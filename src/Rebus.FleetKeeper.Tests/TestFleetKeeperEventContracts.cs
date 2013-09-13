using System;
using NUnit.Framework;
using Rebus.FleetKeeper.Client.Events;
using Shouldly;

namespace Rebus.Tests.FleetKeeper
{
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
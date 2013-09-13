using System;
using NUnit.Framework;
using Rebus.FleetKeeper.Client.Events;
using Shouldly;

namespace Rebus.FleetKeeper.Tests
{
    /// <summary>
    /// To obtain backwards compatibilty, existing properties should never be changed or removed.
    /// These tests ensure that required properties are present on the events. Other tests ensure
    /// that deserialized events that matches this contract is always applicable to the fleetkeeper hub
    /// so we should never have to migrate persisted events - and we will be able to handle events from 
    /// busses that might be of different versions running simultaneously.
    /// The crazy concatenation of strings in the tests is to ensure that Resharper does not help
    /// us rename them unintended. Resharper has an issue for refactoring disabling comments,  
    /// you can follow here http://youtrack.jetbrains.com/issue/RSRP-350720.
    /// </summary>
    public class TestFleetKeeperEventContracts
    {
        [Test]
        public void BusStartedHasContract()
        {
            AssertHasProperty<BusStarted, string>("N" + "ame");
            AssertHasProperty<BusStarted, int>("C" + "ontractVersion");
            AssertHasProperty<BusStarted, Guid>("I" + "d");
            AssertHasProperty<BusStarted, Guid>("S" + "ourceBusId");
            AssertHasProperty<BusStarted, DateTimeOffset>("T" + "imestamp");
        }

        public void AssertHasProperty<TType, TProperty>(string name)
        {
            var property = typeof(TType).GetProperty(name, typeof(TProperty));
            property.ShouldNotBe(null);
            property.CanRead.ShouldBe(true);
            property.CanWrite.ShouldBe(true);
        }
    }
}
using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper.Tests
{
    public class TestAggregate : Aggregate
    {
        public TestAggregate()
        {
            Calls = new Dictionary<string, JObject>();
        }

        public Dictionary<string, JObject> Calls { get; set; }

        public override void ApplyStateToClient()
        {
            throw new NotImplementedException();
        }

        public override void ApplyBusStarted(JObject @event, bool applyToClient)
        {
            Calls.Add("BusStarted", @event);
        }

        public override void ApplyBusStopped(JObject @event, bool applyToClient)
        {
            throw new NotImplementedException();
        }
    }
}
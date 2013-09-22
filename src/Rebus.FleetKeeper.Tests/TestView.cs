using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper.Tests
{
    public class TestView : ReadModel
    {
        public TestView()
        {
            Calls = new Dictionary<string, JObject>();
        }

        public Dictionary<string, JObject> Calls { get; set; }

        public override JsonAction ApplyBusStarted(JObject @event)
        {
            Calls.Add("BusStarted", @event);
            return null;
        }

        public override JsonAction ApplyBusStopped(JObject @event)
        {
            throw new NotImplementedException();
            return null;
        }
    }
}
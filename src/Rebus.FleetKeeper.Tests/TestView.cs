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

        public override JsonPatch ApplyBusStarted(JObject @event)
        {
            Calls.Add("BusStarted", @event);
            return null;
        }

        public override JsonPatch ApplyMessageReceived(JObject @event)
        {
            throw new NotImplementedException();
        }

        public override JsonPatch ApplyMessageHandled(JObject @event)
        {
            throw new NotImplementedException();
        }

        public override JsonPatch ApplyBusStopped(JObject @event)
        {
            throw new NotImplementedException();
            return null;
        }

        public override JsonPatch ApplyHeartbeat(JObject @event)
        {
            throw new NotImplementedException();
        }
    }
}
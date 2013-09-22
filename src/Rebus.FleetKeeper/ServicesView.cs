using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper
{
    public class ServicesView : ReadModel 
    {
        public ServicesView()
        {
            Services = new List<Bus>();
        }

        public List<Bus> Services { get; private set; }

        public override JsonAction ApplyBusStarted(JObject @event)
        {
            var bus = new Bus
            {
                Id = Guid.NewGuid(),
                BusClientId = (Guid)@event["BusClientId"], 
                Endpoint = (string)@event["Endpoint"]
            };

            Services.Add(bus);

            return new Add
            {
                Path = "Services",
                Data = bus
            };
        }

        public override JsonAction ApplyBusStopped(JObject @event)
        {
            var bus = Services.Single(x => x.BusClientId == (Guid) @event["BusClientId"]);
            
            Services.Remove(bus);

            return new JsonAction();
        }

        public class Bus
        {
            public Guid Id { get; set; }
            public Guid BusClientId { get; set; }
            public string Endpoint { get; set; }
        }
    }


}
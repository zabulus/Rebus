using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNet.SignalR.Hubs;
using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper
{
    public class BusAggregate : Aggregate 
    {
        readonly IHub hub;

        public BusAggregate(IHub hub)
        {
            this.hub = hub;
            Busses = new List<Bus>();
        }

        public List<Bus> Busses { get; private set; }

        public override void ApplyStateToClient()
        {
            WebClients.setBusses(Busses);
        }

        public override void ApplyBusStarted(JObject @event, bool applyToClient)
        {
            var bus = new Bus
            {
                Id = Guid.NewGuid(),
                BusClientId = (Guid)@event["BusClientId"], 
                Endpoint = (string)@event["Endpoint"]
            };

            Busses.Add(bus);
    
            if (applyToClient)
            {
                WebClients.addBus(bus);
            }
        }

        public override void ApplyBusStopped(JObject @event, bool applyToClient)
        {
            var bus = Busses.Single(x => x.BusClientId == (Guid) @event["BusClientId"]);
            
            Busses.Remove(bus);

            if (applyToClient)
            {
                WebClients.removeBus(bus.Id);
            }
        }

        public dynamic WebClients
        {
            get { return hub.Clients.Group("webclients"); }
        }

        public class Bus
        {
            public Guid Id { get; set; }
            public Guid BusClientId { get; set; }
            public string Endpoint { get; set; }
        }
    }


}
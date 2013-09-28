using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json.Linq;
using log4net;

namespace Rebus.FleetKeeper
{
    public class ServicesView : ReadModel 
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        public ServicesView()
        {
            Services = new List<Bus>();
        }

        public List<Bus> Services { get; private set; }

        public override JsonPatch ApplyBusStarted(JObject @event)
        {
            var bus = new Bus
            {
                Id = Guid.NewGuid(),
                BusClientId = (Guid)@event["BusClientId"], 
                Endpoint = (string)@event["Endpoint"],
                ProcessName = (string)@event["ProcessName"],
                LastLifeSign = (DateTimeOffset) @event["Timestamp"]
            };

            Services.Add(bus);

            return new Add
            {
                Path = "/services/-",
                Value = bus,
                Version = Version
            };
        }

        public override JsonPatch ApplyMessageReceived(JObject @event)
        {
            Log.Debug("ApplyMessageReceived. MessageId=" + (string)@event["MessageId"]);

            var bus = Services.Single(x => x.BusClientId == (Guid)@event["BusClientId"]);

            var message = new Message
            {
                Id = (string) @event["MessageId"],
                Type = (string) @event["MessageType"]
            };

            bus.CurrentMessages.Add(message);

            return new Add
            {
                Path = string.Format("/services/{0}/currentMessages/-", Services.IndexOf(bus)),
                Value = message,
                Version = Version
            };
        }

        public override JsonPatch ApplyMessageHandled(JObject @event)
        {
            Log.Debug("ApplyMessageHandled. MessageId=" + (string)@event["MessageId"]);

            var bus = Services.Single(x => x.BusClientId == (Guid)@event["BusClientId"]);
            var message = bus.CurrentMessages.Single(x => x.Id == (string) @event["MessageId"]);
            var messageIndex = bus.CurrentMessages.IndexOf(message);

            bus.CurrentMessages.Remove(message);

            return new Remove
            {
                Path = string.Format("/services/{0}/currentMessages/{1}", Services.IndexOf(bus), messageIndex),
                Version = Version
            };
        }

        public override JsonPatch ApplyBusStopped(JObject @event)
        {
            var bus = Services.Single(x => x.BusClientId == (Guid) @event["BusClientId"]);
            
            Services.Remove(bus);

            return new JsonPatch();
        }

        public override JsonPatch ApplyHeartbeat(JObject @event)
        {
            var bus = Services.Single(x => x.BusClientId == (Guid)@event["BusClientId"]);

            bus.LastLifeSign = (DateTimeOffset)@event["Timestamp"];

            return new Replace
            {
                Path = string.Format("/services/{0}/lastLifeSign", Services.IndexOf(bus)),
                Value = bus.LastLifeSign,
                Version = Version
            };
        }

        public class Bus
        {
            public Bus()
            {
                CurrentMessages = new List<Message>();
            }

            public Guid Id { get; set; }
            public Guid BusClientId { get; set; }
            public string Endpoint { get; set; }
            public string ProcessName { get; set; }
            public DateTimeOffset LastLifeSign { get; set; }
            public List<Message> CurrentMessages { get; set; }
        }

        public class Message
        {
            public string Id { get; set; }
            public string Type { get; set; }
        }
    }


}
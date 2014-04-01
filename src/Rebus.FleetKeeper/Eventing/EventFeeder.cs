using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Messages;

namespace Rebus.FleetKeeper.Eventing
{
    public class EventFeeder
    {
        readonly JsonSerializer serializer;
        readonly IReadModel[] readModels;

        public EventFeeder(JsonSerializer serializer, params IReadModel[] readModels)
        {
            this.serializer = serializer;
            this.readModels = readModels;
        }

        public void Apply(JObject @event)
        {
            var eventId = (string)@event["Id"];
            var eventName = (string)@event["Name"];

            foreach (var readModel in readModels)
            {
                switch (eventName)
                {
                    case "BusStarted":
                        readModel.Apply(@event.ToObject<BusStarted>(serializer));
                        break;
                    case "BusStopped":
                        readModel.Apply(@event.ToObject<BusStopped>(serializer));
                        break;
                    case "MessageReceived":
                        readModel.Apply(@event.ToObject<MessageReceived>(serializer));
                        break;
                    case "MessageHandled":
                        readModel.Apply(@event.ToObject<MessageHandled>(serializer));
                        break;
                    case "HeartBeat":
                        readModel.Apply(@event.ToObject<HeartBeat>(serializer));
                        break;
                }
            }
        }
    }
}
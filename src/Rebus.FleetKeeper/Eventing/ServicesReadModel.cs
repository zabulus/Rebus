using System;
using System.Collections.Generic;
using Rebus.FleetKeeper.Messages;
using Rebus.FleetKeeper.Old;

namespace Rebus.FleetKeeper.Eventing
{
    public class ServicesReadModel : ReadModel, IEventEater<BusStarted>, IEventEater<BusStopped>, IEventEater<MessageReceived>
    {
        public ServicesReadModel()
        {
            Services = new List<Service>();
        }

        public List<Service> Services { get; set; }

        public void Apply(BusStarted @event)
        {
            var index = Services.FindIndex(x => x.BusClientId == @event.BusClientId);
            if (index > -1)
            {
                var service = Services[index];
                service.IsStarted = true;
                
                Changes.Add(new Replace
                {
                    Path = string.Format("/services/{0}/isStarted", index),
                    Value = true,
                    Version = 1
                });
            }
            else
            {
                var service = new Service
                {
                    Id = Guid.NewGuid(),
                    BusClientId = @event.BusClientId,
                    Endpoint = @event.Endpoint,
                    ProcessName = @event.ProcessName,
                    LastLifeSign = @event.Timestamp,
                    IsStarted = true
                };

                Services.Add(service);

                Changes.Add(new Add
                {
                    Path = "/services/-",
                    Value = service,
                    Version = 1
                });
            }
        }

        public void Apply(BusStopped @event)
        {
            var index = Services.FindIndex(x => x.BusClientId == @event.BusClientId);
            var service = Services[index];

            service.IsStarted = false;

            Changes.Add(new Replace
            {
                Path = string.Format("/services/{0}/isStarted", index),
                Value = false,
                Version = 1
            });
        }

        public void Apply(MessageReceived @event)
        {
        }


        public class Service
        {
            public Service()
            {
                CurrentMessages = new List<Message>();
            }

            public Guid Id { get; set; }
            public Guid BusClientId { get; set; }
            public string Endpoint { get; set; }
            public string ProcessName { get; set; }
            public DateTimeOffset LastLifeSign { get; set; }
            public bool IsStarted { get; set; }
            public List<Message> CurrentMessages { get; set; }
        }

        public class Message
        {
            public string Id { get; set; }
            public string Type { get; set; }
        }
    }
}
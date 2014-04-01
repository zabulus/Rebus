using System;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Messages;

namespace Rebus.FleetKeeper.Http
{
    public class RebusHub : Hub
    {
        readonly IObserver<Event> observer;

        public RebusHub(IObserver<Event> observer)
        {
            this.observer = observer;
        }

        public void Receive(Event @event)
        {
            observer.OnNext(@event);
        }

        public void Send(JObject @event)
        {
        }
    }
}
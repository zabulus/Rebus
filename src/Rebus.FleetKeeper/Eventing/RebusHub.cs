using System;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Messages;
using Rebus.FleetKeeper.Old;

namespace Rebus.FleetKeeper.Eventing
{
    public class RebusHub : Hub
    {
        static Action<Event> OnReceive = x => { };
        
        public static IObservable<Event> Events { get; private set; }

        static RebusHub()
        {
            var events = Observable.Create<Event>(observer =>
            {
                OnReceive += observer.OnNext;
                return Disposable.Create(() =>
                {
                    OnReceive -= observer.OnNext;
                });
            })
            .Synchronize()
            .OrderBy(@event => @event.Version);
            
            Events = events;
        }

        public void Receive(Event @event)
        {
            OnReceive(@event);
        }

        public void Send(JObject @event)
        {
        }
    }
}
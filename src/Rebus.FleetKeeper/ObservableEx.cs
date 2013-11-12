using System;
using System.Collections.Generic;
using System.Linq;
using System.Reactive.Linq;

namespace Rebus.FleetKeeper
{
    public static class ObservableEx
    {
        public static IObservable<T> OrderBy<T>(this IObservable<T> observable, Func<T, long> selector)
        {
            return Observable.Create<T>(observer =>
            {
                var nextVersionExpected = 1L;
                var previousEvents = new List<T>();
                return observable.Subscribe(@event =>
                {
                    lock (previousEvents)
                    {
                        previousEvents.Add(@event);

                        var version = selector(@event);
                        if (version != nextVersionExpected) return;

                        foreach (var previousEvent in previousEvents.OrderBy(selector).ToList())
                        {
                            if (selector(previousEvent) != nextVersionExpected)
                                break;

                            observer.OnNext(previousEvent);
                            previousEvents.Remove(previousEvent);
                            nextVersionExpected++;
                        }
                    }
                });
            });
        }
    }
}
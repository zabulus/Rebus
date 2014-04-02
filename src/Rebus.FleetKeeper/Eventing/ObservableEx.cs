using System;
using System.Collections.Generic;
using System.Linq;
using System.Reactive.Linq;

namespace Rebus.FleetKeeper.Eventing
{
    public static class ObservableEx
    {
        public static IObservable<T> OrderBy<T>(this IObservable<T> observable, Func<T, long> selector)
        {
            return Observable.Create<T>(observer =>
            {
                var expectedSeq = 1L;
                var buffer = new List<T>();
                return observable
                    .Timeout(TimeSpan.FromMilliseconds(500))
                    .Subscribe(@event =>
                    {
                        buffer.Add(@event);

                        var nextSeq = selector(@event);
                        if (nextSeq != expectedSeq) return;

                        foreach (var previousEvent in buffer.OrderBy(selector).ToList())
                        {
                            if (selector(previousEvent) != expectedSeq)
                                break;

                            observer.OnNext(previousEvent);
                            buffer.Remove(previousEvent);
                            expectedSeq++;
                        }
                    }, 
                    exception =>
                    {
                        foreach (var previousEvent in buffer.OrderBy(selector).ToList())
                        {
                            observer.OnNext(previousEvent);
                            buffer.Remove(previousEvent);
                            expectedSeq++;
                        }
                    });
            });
        }
    }
}
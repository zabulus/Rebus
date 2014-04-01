using System;
using System.Collections.Generic;
using System.Linq;
using System.Reactive.Linq;

namespace Rebus.FleetKeeper.Old
{
    public static class ObservableEx
    {
        public static IObservable<TSource> Sort<TSource, TKey>(
            this IObservable<TSource> source,
            Func<TSource, TKey> keySelector,
            TKey firstKey,
            Func<TKey, TKey> nextKeyFunc)
        {
            return Observable.Create<TSource>(o =>
            {
                var nextKey = firstKey;
                var buffer = new Dictionary<TKey, TSource>();
                return source.Subscribe(i =>
                {
                    if (keySelector(i).Equals(nextKey))
                    {
                        nextKey = nextKeyFunc(nextKey);
                        o.OnNext(i);
                        TSource nextValue;
                        while (buffer.TryGetValue(nextKey, out nextValue))
                        {
                            buffer.Remove(nextKey);
                            o.OnNext(nextValue);
                            nextKey = nextKeyFunc(nextKey);
                        }
                    }
                    else buffer.Add(keySelector(i), i);
                });
            });
        }

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
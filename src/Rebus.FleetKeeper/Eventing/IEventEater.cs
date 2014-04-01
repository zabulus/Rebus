using System.Collections.Generic;
using Rebus.FleetKeeper.Messages;

namespace Rebus.FleetKeeper.Eventing
{
    public interface IEventEater<TEvent>
    {
        void Apply(TEvent @event);
    }

    public interface IEventFeeder<TIn, TOut>
    {
        IEnumerable<TOut> Apply(TIn @event);
    }
}
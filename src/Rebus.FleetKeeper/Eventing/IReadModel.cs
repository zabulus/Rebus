using Rebus.FleetKeeper.Messages;

namespace Rebus.FleetKeeper.Eventing
{
    public interface IReadModel
    {
        void Apply(BusStarted @event);
        void Apply(BusStopped @event);
        void Apply(MessageReceived @event);
        void Apply(MessageHandled @event);
        void Apply(HeartBeat @event);
    }
}
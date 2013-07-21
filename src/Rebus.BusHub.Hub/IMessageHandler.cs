namespace Rebus.BusHub.Hub
{
    public interface IMessageHandler
    {
        void Handle(object message);
    }
}
namespace Rebus.Bus
{
    class ReplyDispatcher : ISendReplies
    {
        readonly IBus bus;

        public ReplyDispatcher(IBus bus)
        {
            this.bus = bus;
        }

        public void Reply(object reply)
        {
            bus.Reply(reply);
        }
    }
}
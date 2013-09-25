using Rebus.Bus;

namespace Rebus.Tests
{
    class ReplyDispatcherForTesting : ISendReplies
    {
        public void Reply(object reply)
        {
        }
    }
}
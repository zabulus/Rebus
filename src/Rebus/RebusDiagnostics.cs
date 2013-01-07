using System;
using Rebus.Bus;

namespace Rebus
{
    public class RebusDiagnostics : IRebusDiagnostics 
    {
        readonly RebusBus bus;

        public RebusDiagnostics(RebusBus bus)
        {
            this.bus = bus;
        }

        public void ReturnErroneousMessagesToSourceQueue(params Guid[] messageIds)
        {
            throw new NotImplementedException();
        }

        public int QueueStats()
        {
            return 12;
        }
    }
}
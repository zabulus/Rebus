using System;

namespace Rebus
{
    /// <summary>
    /// Groups Rebus' operations for accessing queue diagnostics and operating on the queue.
    /// </summary>
    public interface IRebusDiagnostics
    {
        void ReturnErroneousMessagesToSourceQueue(params Guid[] messageIds);
    }
}
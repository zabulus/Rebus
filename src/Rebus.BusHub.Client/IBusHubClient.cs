using System;
using System.Reflection;

namespace Rebus.BusHub.Client
{
    public interface IBusHubClient
    {
        string InputQueueAddress { get; }
        Guid ClientId { get; }
        event Action BeforeDispose;
        Assembly GetEntryAssembly();
    }
}
using Rebus.Bus;

namespace Rebus.Tests
{
    class EndpointInterrogatorForTesting : IInterrogateThisEndpoint
    {
        public bool OneWayClientMode { get; private set; }
        public string InputQueueAddress { get; private set; }
        public int Workers { get; private set; }
        public int AppDomainRebusEndpointId { get; private set; }
        public bool IsBrokered { get; private set; }
    }
}
namespace Rebus.Bus
{
    interface IInterrogateThisEndpoint
    {
        bool OneWayClientMode { get; }
        string InputQueueAddress { get; }
        int Workers { get; }
        int AppDomainRebusEndpointId { get; }
        bool IsBrokered { get; }
    }
}
namespace Rebus.Bus
{
    public interface IInterrogateThisEndpoint
    {
        /// <summary>
        /// Is this bus instance setup as a one way client, that is "send only"
        /// </summary>
        bool OneWayClientMode { get; }
        
        /// <summary>
        /// Adress of the input queue
        /// </summary>
        string InputQueueAddress { get; }
        
        /// <summary>
        /// Number of active workers serving this endpoint
        /// </summary>
        int Workers { get; }
        
        /// <summary>
        /// Bus instance id - unique for the AppDomain
        /// </summary>
        int AppDomainRebusEndpointId { get; }
        
        /// <summary>
        /// 
        /// </summary>
        bool IsBrokered { get; }
    }
}
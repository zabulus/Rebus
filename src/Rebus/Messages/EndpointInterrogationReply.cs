using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Rebus.Messages
{
    /// <summary>
    /// Response from receiving an <see cref="EndpointInterrogationRequest"/>. Contains results returned
    /// by the interrogated endpoint 
    /// </summary>
    [Serializable]
    public class EndpointInterrogationReply : IRebusControlMessage
    {
        /// <summary>
        /// Returns information about the process in which the endpoint is running
        /// </summary>
        public ProcessInfo ProcessInfo { get; set; }

        /// <summary>
        /// Returns information about the environment in which the endpoint is running
        /// </summary>
        public EnvironmentInfo EnvironmentInfo { get; set; }
        
        /// <summary>
        /// Returns Rebus-specific information about the endpoint
        /// </summary>
        public RebusEndpointInfo RebusEndpointInfo { get; set; }

        /// <summary>
        /// Indicates whether the interrogation was a success - if this one is true,
        /// all fields aggregated in the reply can be assumed to be non-null
        /// </summary>
        public bool Success { get; set; }
        
        /// <summary>
        /// In case <see cref="Success"/> is false, this list will contain a textual
        /// description of each error
        /// </summary>
        public List<string> InterrogationErrors { get; set; }

        public override string ToString()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }
    }

    /// <summary>
    /// Represents various pieces of Rebus-specific information
    /// </summary>
    [Serializable]
    public class RebusEndpointInfo
    {
        /// <summary>
        /// Indicates whether the endpoint is configured to work in send-only mode
        /// </summary>
        public bool OneWayClientMode { get; set; }
        
        /// <summary>
        /// The globally addressable address of the endpoint
        /// </summary>
        public string InputQueueAddress { get; set; }

        /// <summary>
        /// How many workers are currently running in the endpoint
        /// </summary>
        public int Workers { get; set; }
        
        /// <summary>
        /// What is the Rebus ID (global per app domain)
        /// </summary>
        public int AppDomainRebusEndpointId { get; set; }

        /// <summary>
        /// Which multicast mode is the endpoint currently running with
        /// </summary>
        public string MulticastOptions { get; set; }
    }

    /// <summary>
    /// Indicates the different kinds of multicast options available
    /// </summary>
    public class MulticastOptions
    {
        /// <summary>
        /// Multicast is distributed. This means that no central broker is used, so multicast is implemented
        /// by each endpoint directly sending published messages to each subscriber.
        /// </summary>
        public const string Distributed = "Distributed";
        
        /// <summary>
        /// Multicast is centralized. This means that a central broker takes care of delivering a published
        /// message to subscribers. This mode implies that the broker functions as the subscriptions storage
        /// as well.
        /// </summary>
        public const string Centralized = "Centralized";
    }

    /// <summary>
    /// Contains information about the OS process in which the endpoint is hosted.
    /// </summary>
    [Serializable]
    public class ProcessInfo
    {
        /// <summary>
        /// The OS name of the process
        /// </summary>
        public string ProcessName { get; set; }
        
        /// <summary>
        /// The time when the process was started
        /// </summary>
        public DateTime StartTime { get; set; }
        
        /// <summary>
        /// The OS id of the process
        /// </summary>
        public int Id { get; set; }
    }

    /// <summary>
    /// Contains information about the environment on which this endpoint is running
    /// </summary>
    [Serializable]
    public class EnvironmentInfo
    {
        /// <summary>
        /// The username of the identity under which the current process is running
        /// </summary>
        public string UserName { get; set; }
        
        /// <summary>
        /// The command line used to invoke the current process
        /// </summary>
        public string CommandLine { get; set; }
        
        /// <summary>
        /// The name of the machine on which the process is running
        /// </summary>
        public string MachineName { get; set; }
        
        /// <summary>
        /// The name of the domain
        /// </summary>
        public string UserDomainName { get; set; }
        
        /// <summary>
        /// Version of the OS
        /// </summary>
        public string OSVersion { get; set; }
        
        /// <summary>
        /// Is the OS 64 bit?
        /// </summary>
        public bool Is64BitOperatingSystem { get; set; }
        
        /// <summary>
        /// Is the currently running process running in 64 bit mode?
        /// </summary>
        public bool Is64BitProcess { get; set; }
        
        /// <summary>
        /// Size of memory allocated to the process by the OS
        /// </summary>
        public long WorkingSet { get; set; }
    }
}
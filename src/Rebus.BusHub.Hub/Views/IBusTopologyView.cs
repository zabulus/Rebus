using System;
using System.Collections.Generic;

namespace Rebus.BusHub.Hub.Views
{
    public interface IBusTopologyView
    {
        IEnumerable<BusInstance> GetBusInstances();
    }

    public class BusInstance
    {
        public string ClientId { get; set; }
        
        public string InputQueueAddress { get; set; }

        public BusInstanceRunningStatus Status { get; set; }

        public DateTime ClientTimeUtc { get; set; }
    }

    public enum BusInstanceRunningStatus
    {
        Started, Stopped, Unknown
    }
}
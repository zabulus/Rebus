using System;
using System.Collections.Generic;
using Rebus.BusHub.Hub.Views;
using Rebus.BusHub.Messages.Causal;
using System.Linq;

namespace Rebus.BusHub.Hub.Handlers
{
    public class BusTopology : IBusTopologyView, 
        IMessageHandler<BusHasBeenStarted>,
        IMessageHandler<BusHasBeenStopped>
    {
        readonly Dictionary<string, BusInstance> instances = new Dictionary<string, BusInstance>(StringComparer.InvariantCultureIgnoreCase);

        public IEnumerable<BusInstance> GetBusInstances()
        {
            return instances.Values.ToList();
        }

        public void Handle(BusHasBeenStarted message)
        {
            var clientId = message.ClientId;
            EnsureCreated(clientId);

            var busInstance = instances[clientId];
            busInstance.ClientId = clientId;
            busInstance.Status = BusInstanceRunningStatus.Started;
            busInstance.InputQueueAddress = message.InputQueueAddress;
            busInstance.ClientTimeUtc = message.ClientTimeUtc;
        }

        public void Handle(BusHasBeenStopped message)
        {
            var clientId = message.ClientId;
            EnsureCreated(clientId);

            var busInstance = instances[clientId];
            busInstance.Status = BusInstanceRunningStatus.Stopped;
            busInstance.ClientTimeUtc = message.ClientTimeUtc;
        }

        void EnsureCreated(string clientId)
        {
            if (clientId == null)
            {
                throw new ArgumentNullException("clientId", "ClientId cannot be null!");
            }

            if (instances.ContainsKey(clientId)) return;
            
            instances[clientId] = new BusInstance();
        }
    }
}
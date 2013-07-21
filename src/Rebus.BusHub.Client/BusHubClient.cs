using System;
using Microsoft.AspNet.SignalR.Client.Hubs;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client
{
    public class BusHubClient : IDisposable
    {
        readonly HubConnection connection;
        readonly IHubProxy hubProxy;

        public BusHubClient(string busHubUri)
        {
            connection = new HubConnection(busHubUri);
            hubProxy = connection.CreateHubProxy("RebusHub");
            hubProxy.On("MessageToClient", (string str) => ReceiveMessage(Deserialize(str)));
            connection.Start().Wait();
        }

        public void Send(BusHubMessage message)
        {
            hubProxy.Invoke("MessageToHub", Serialize(message));
        }

        object Deserialize(string str)
        {
            throw new NotImplementedException();
        }

        void ReceiveMessage(object message)
        {
            
        }

        object Serialize(BusHubMessage message)
        {
            throw new NotImplementedException();
        }

        public void Dispose()
        {
            connection.Stop();
        }
    }
}

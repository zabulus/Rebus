using System;
using Microsoft.AspNet.SignalR.Client.Hubs;
using Newtonsoft.Json;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client
{
    public class BusHubClient : IDisposable
    {
        static readonly JsonSerializerSettings SerializerSettings =
            new JsonSerializerSettings {TypeNameHandling = TypeNameHandling.All};

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
            return JsonConvert.DeserializeObject(str, SerializerSettings);
        }

        void ReceiveMessage(object message)
        {
            
        }

        string Serialize(BusHubMessage message)
        {
            var str = JsonConvert.SerializeObject(message, SerializerSettings);

            return str;
        }

        public void Dispose()
        {
            connection.Stop();
        }
    }
}

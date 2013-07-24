using System;
using Microsoft.AspNet.SignalR.Client.Hubs;
using Newtonsoft.Json;
using Rebus.BusHub.Messages;
using Rebus.Logging;

namespace Rebus.BusHub.Client
{
    public class BusHubClient : IDisposable
    {
        static ILog log;

        static BusHubClient()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        public string InputQueueAddress { get; private set; }

        static readonly JsonSerializerSettings SerializerSettings =
            new JsonSerializerSettings {TypeNameHandling = TypeNameHandling.All};

        readonly HubConnection connection;
        readonly IHubProxy hubProxy;

        public BusHubClient(string busHubUri, string inputQueueAddress)
        {
            InputQueueAddress = inputQueueAddress;

            log.Info("Establishing hub connection to {0}", busHubUri);
            connection = new HubConnection(busHubUri);
            
            log.Info("Creating hub proxy");
            hubProxy = connection.CreateHubProxy("RebusHub");
            hubProxy.On("MessageToClient", (string str) => ReceiveMessage(Deserialize(str)));

            log.Info("Starting connection");
            connection.Start().Wait();
            log.Info("Started!");
        }

        public void Start()
        {
            log.Info("Starting bus hub client");
        }

        public void Send(BusHubMessage message)
        {
            log.Debug("Sending bus hub message: {0}", message);
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
            log.Info("Disposing connection to bus hub");
            connection.Stop();
        }
    }
}

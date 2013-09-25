using System;
using System.Diagnostics;
using System.Linq;
using Microsoft.AspNet.SignalR.Client;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Client.Events;
using Rebus.Logging;

namespace Rebus.FleetKeeper.Client
{
    public class FleetKeeperClient : IDisposable
    {
        static ILog log;
        readonly Guid clientId;

        readonly HubConnection connection;
        readonly IHubProxy hub;

        static FleetKeeperClient()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        public FleetKeeperClient(string uri)
        {
            clientId = Guid.NewGuid();

            log.Info("Establishing hub connection to {0}", uri);
            connection = new HubConnection(uri);

            log.Info("Creating hub proxy");
            hub = connection.CreateHubProxy("FleetKeeperHub");

            log.Info("Starting connection");
            connection.Start().Wait();
            log.Info("Started!");
        }

        public void OnBusStarted(IBus bus)
        {
            var currentProcess = Process.GetCurrentProcess();
            var processStartInfo = currentProcess.StartInfo;
            var fileName = !string.IsNullOrWhiteSpace(processStartInfo.FileName)
                               ? processStartInfo.FileName
                               : currentProcess.ProcessName;


            //new
            //{
            //    ClientId = clientId, 
            //    //InputQueueAddress = bus.Advanced.Diagnostics.InputQueueName,
            //    Environment.MachineName,
            //    Os = Environment.OSVersion.ToString(),
            //    FileName = fileName
            //}

            var receiveMessages = bus.Advanced.Diagnostics.ReceiveMessagesQueue;
            Send(new BusStarted
            {
                BusClientId = clientId,
                Endpoint = receiveMessages.InputQueueAddress
            });
        }

        public void OnBusDisposed(IBus bus)
        {
            var receiveMessages = bus.Advanced.Diagnostics.ReceiveMessagesQueue;
            Send(new BusStopped
            {
                BusClientId = clientId,
                Endpoint = receiveMessages.InputQueueAddress
            });

            Dispose();
        }

        void Send(Event @event)
        {
            hub.Invoke("ReceiveFromBus", JObject.FromObject(@event));
        }

        public void Dispose() { }
    }
}
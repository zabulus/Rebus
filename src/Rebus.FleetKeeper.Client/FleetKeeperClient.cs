using System;
using System.Diagnostics;
using Microsoft.AspNet.SignalR.Client;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Client.Messages;
using Rebus.Logging;

namespace Rebus.FleetKeeper.Client
{
    public class FleetKeeperClient : IDisposable
    {
        static ILog log;
        readonly Guid clientId;

        readonly HubConnection connection;
        readonly IHubProxy hubProxy;

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
            hubProxy = connection.CreateHubProxy("FleetKeeperHub");
            //hubProxy.On("MessageToClient", (string str) => ReceiveMessage(Deserialize(str)));

            log.Info("Starting connection");
            connection.Start().Wait();
            log.Info("Started!");
        }

        public void Dispose() {}

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

            hubProxy.Invoke("ReceiveFromBus", new BusStarted());
        }

        public void OnBusDispose(IBus bus)
        {
            Dispose();
        }
    }
}
using System;
using System.Diagnostics;
using System.Threading;
using Microsoft.AspNet.SignalR.Client;
using Newtonsoft.Json.Linq;
using Rebus.FleetKeeper.Messages;
using Rebus.Logging;
using Rebus.Shared;

namespace Rebus.FleetKeeper.Client
{
    public class FleetKeeperClient : IDisposable
    {
        static ILog log;

        readonly HubConnection connection;
        readonly IHubProxy hub;
        long version;
        Timer timer;
        BusIdentification identification;

        static FleetKeeperClient()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        public FleetKeeperClient(string uri)
        {
            version = 0;

            log.Info("Establishing hub connection to {0}", uri);
            connection = new HubConnection(uri);

            log.Info("Creating hub proxy");
            hub = connection.CreateHubProxy("RxHub");

            log.Info("Starting connection");
            connection.Start().Wait();
            log.Info("Started!");
        }

        public void OnBusStarted(IBus bus)
        {
            if (identification != null)
                throw new InvalidOperationException("Same bus instance seems to have been started twice. FleetKeeper was not ready for that.");

            identification = new BusIdentification(bus);
            Send(new BusStarted());
            timer = new Timer(OnHeartBeat, bus, 3000, 3000);
        }

        public void OnBeforeTransportMessage(IBus bus, ReceivedTransportMessage receivedTransportMessage)
        {
            log.Debug(string.Format("OnBeforeTransportMessage. MessageId={0}", receivedTransportMessage.Headers[Headers.MessageId]));

            Send(new MessageReceived
            {
                MessageId = (string) receivedTransportMessage.Headers[Headers.MessageId],
                MessageType = receivedTransportMessage.Label
            });
        }

        public void OnAfterTransportMessage(IBus bus, Exception exceptionOrNull, ReceivedTransportMessage receivedTransportMessage)
        {
            log.Debug(string.Format("OnAfterTransportMessage. MessageId={0}", receivedTransportMessage.Headers[Headers.MessageId]));

            Send(new MessageHandled
            {
                MessageId = (string)receivedTransportMessage.Headers[Headers.MessageId],
            });
        }

        void OnHeartBeat(object state)
        {
            // TODO: There's a little concurrency issue here, I think.
            // Connection might have been disposed, if bus was stopped
            // at the time of a heartbeat
            //Send(new HeartBeat());
        }

        public void OnBusDisposed(IBus bus)
        {
            Send(new BusStopped());
            Dispose();
        }

        void Send(Event @event)
        {
            @event.Version = version;

            version++;

            if (identification != null)
            {
                @event.BusClientId = identification.BusClientId;
                @event.Endpoint = identification.Endpoint;
                @event.ProcessName = identification.ProcessName;
            }

            log.Debug("Sending event {0} ({1}) to FleetKeeper", @event.Name, @event.Id);

            hub.Invoke("Receive", JObject.FromObject(@event));
        }

        public void Dispose()
        {
            timer.Dispose();
            connection.Dispose();
        }

        public class BusIdentification
        {
            public BusIdentification(IBus bus)
            {
                var currentProcess = Process.GetCurrentProcess();
                var processStartInfo = currentProcess.StartInfo;
                var processName = !string.IsNullOrWhiteSpace(processStartInfo.FileName)
                                   ? processStartInfo.FileName
                                   : currentProcess.ProcessName;

                var inputQueueAddress = bus.Advanced.Interrogation.InputQueueAddress;

                BusClientId = Guid.NewGuid();
                Endpoint = inputQueueAddress;
                ProcessName = processName;
            }

            public Guid BusClientId { get; set; }
            public string Endpoint { get; set; }
            public string ProcessName { get; set; }
        }
    }
}
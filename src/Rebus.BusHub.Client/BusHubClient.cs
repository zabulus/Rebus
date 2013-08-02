using System;
using System.Collections.Generic;
using System.Reflection;
using System.Web;
using Microsoft.AspNet.SignalR.Client.Hubs;
using Newtonsoft.Json;
using Rebus.BusHub.Client.Jobs;
using Rebus.BusHub.Messages;
using Rebus.Logging;
using System.Linq;

namespace Rebus.BusHub.Client
{
    public class BusHubClient : IDisposable, IBusHubClient
    {
        static ILog log;

        static BusHubClient()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        public string InputQueueAddress { get; private set; }

        static readonly JsonSerializerSettings SerializerSettings =
            new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.All };

        readonly HubConnection connection;
        readonly IHubProxy hubProxy;

        readonly List<Job> jobs =
            new List<Job>
                {
                    new NotifyClientIsOnline(),
                    new SendHeartbeat(),
                    new SendMessageHandlingStats(),
                    new SendMessageSendingStats(),
                    new NotifyClientIsOffline(),
                };

        public BusHubClient(string busHubUri, string inputQueueAddress)
        {
            ClientId = Guid.NewGuid();
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

        public Guid ClientId { get; private set; }

        public event Action BeforeDispose = delegate { };
        
        public Assembly GetEntryAssembly()
        {
            return Assembly.GetEntryAssembly() ?? GetWebEntryAssembly();
        }

        static Assembly GetWebEntryAssembly()
        {
            if (HttpContext.Current == null ||
                HttpContext.Current.ApplicationInstance == null)
            {
                return null;
            }

            var type = HttpContext.Current.ApplicationInstance.GetType();

            while (type != null && type.Namespace == "ASP")
            {
                type = type.BaseType;
            }

            return type == null ? null : type.Assembly;
        }

        public void Initialize(IRebusEvents events)
        {
            log.Info("Starting bus hub client");

            jobs.ForEach(job =>
                {
                    log.Debug("Initializing job {0}", job);
                    job.MessageSent += message => MessageSentByJob(job, message);
                    job.Initialize(events, this);
                });
        }

        public void Send(BusHubMessage message)
        {
            log.Debug("Sending bus hub message: {0}", message);
            message.ClientId = ClientId.ToString();
            hubProxy.Invoke("MessageToHub", Serialize(message));
        }

        void MessageSentByJob(Job job, BusHubMessage message)
        {
            Send(message);
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
            BeforeDispose();

            jobs.OfType<IDisposable>()
                .ToList()
                .ForEach(job =>
                    {
                        log.Debug("Disposing job {0}", job);
                        job.Dispose();
                    });

            log.Info("Disposing connection to bus hub");
            connection.Stop();
        }
    }
}

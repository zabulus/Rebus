using System;
using System.Net;
using System.Net.Sockets;
using Newtonsoft.Json;
using Newtonsoft.Json.Bson;
using Rebus.Logging;

namespace Rebus.FleetKeeper
{
    public class FleetKeeperClient : IDisposable
    {
        static ILog log;

        readonly Guid id;
        readonly IBus bus;
        readonly IPAddress ipAddress;
        readonly int port;
        readonly TcpClient tcpClient;
        readonly JsonSerializer serializer;

        static FleetKeeperClient()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        public FleetKeeperClient(IBus bus, IPAddress ipAddress, int port)
        {
            id = Guid.NewGuid();
            this.bus = bus;
            this.ipAddress = ipAddress;
            this.port = port;

            tcpClient = new TcpClient();
            serializer = new JsonSerializer();

        }

        public void Dispose() {}

        public void Start()
        {
            tcpClient.Connect(ipAddress, port);
            Send(new HelloFromClient { ClientId = id });
            Send(new HelloFromClient { ClientId = id });

            log.Info("FleetKeeper client started");
        }

        public void Stop()
        {
            Send(new GoodbyeFromClient { ClientId = id });
            tcpClient.Close();

            log.Info("FleetKeeper client stopped");
        }

        public void Send(object message)
        {
            var networkStream = tcpClient.GetStream();
            networkStream.Write(new[] { (byte)'Q' }, 0, 1);
            //using (var writer = new BsonWriter(networkStream))
            //{
            //    serializer.Serialize(writer, message);
            //}
        }
    }

    public class GoodbyeFromClient
    {
        public Guid ClientId { get; set; }
    }

    public class HelloFromClient
    {
        public Guid ClientId { get; set; }
    }
}
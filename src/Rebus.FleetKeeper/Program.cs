using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Text;
using Rebus.Configuration;
using Rebus.Logging;

namespace Rebus.FleetKeeper
{
    internal class Program
    {
        static void Main(string[] args)
        {
            var server = new FleetKeeperServer();
            server.Start();
        }
    }

    internal class FleetKeeperTcpServer
    {
        // Listen to incoming data from the bus
        // Send a command to the bus about doing something (if it's going to be http)
        
        public void Start()
        {
            var listener = new TcpListener(IPAddress.Any, 8001);
            listener.Start();
            Observable.FromAsync(listener.AcceptTcpClientAsync)
                      .Repeat()
                      .Subscribe(client =>
                      {
                          Console.WriteLine("Connected");
                          var stream = client.GetStream();
                          using (var reader = new StreamReader(stream, Encoding.ASCII))
                          {
                              var str = reader.ReadToEnd();
                              Console.WriteLine(str);
                          }
                      }, () => Console.WriteLine("Final"));
        }
        
    }

    // Send message to client
    // Receive request from client and response with some html
    // Receive request from client and issue a command against the bus
    internal class FleetKeeperHttpServer
    {
        readonly IObservable<Diagnostics> diagnostics;

        public FleetKeeperHttpServer(IObservable<Diagnostics> diagnostics)
        {
            this.diagnostics = diagnostics;
        }

        public void Start()
        {
            var listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:8080/");
            listener.Start();

            Observable.FromAsync(listener.GetContextAsync)
                      .Repeat()
                      .ObserveOn(ThreadPoolScheduler.Instance)
                      .Subscribe(context =>
                      {
                          Console.WriteLine("Incoming request");
                          switch (context.Request.RawUrl)
                          {
                              case "/":
                                  context.Response.OutputStream.Write(Encoding.ASCII.GetBytes("OK"), 0, 2);
                                  Console.ReadLine();
                                  break;
                              case "/test":
                                  context.Response.OutputStream.Write(Encoding.ASCII.GetBytes("OK"), 0, 2);
                                  break;
                              case "/poll":
                                  break;
                          }

                          context.Response.Close();
                      });
        }
    }

    public class Command
    {
        
    }

    public class FleetKeeperServer : IDisposable
    {
        FleetKeeperTcpServer tcpServer;
        FleetKeeperHttpServer httpServer;

        public FleetKeeperServer()
        {
            tcpServer = new FleetKeeperTcpServer();
            httpServer = new FleetKeeperHttpServer(Observable.Empty<Diagnostics>());
        }

        public void Start()
        {
            httpServer.Start();
            Console.ReadLine();
        }

        public void Dispose()
        {
            
        }
    }

    public class FleetKeeperClient : IDisposable
    {
        static ILog log;
        
        readonly IBus bus;
        readonly IPAddress ipAddress;
        readonly int port;

        static FleetKeeperClient()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        public FleetKeeperClient(IBus bus, IPAddress ipAddress, int port)
        {
            this.bus = bus;
            this.ipAddress = ipAddress;
            this.port = port;
        }

        public void Dispose() {}

        public void Start()
        {
            log.Info("FleetKeeper client started");

            var tcpClient = new TcpClient();
            tcpClient.Connect(ipAddress, port);
            var stream = tcpClient.GetStream();
            stream.Write(new[] { (byte)'Y', (byte)'O' }, 0, 2);
            tcpClient.Close();
        }

        public void Stop()
        {
            log.Info("FleetKeeper client stopped");
        }
    }

    public static class BusExtensions
    {
        public static ConcurrentDictionary<IBus, FleetKeeperClient> clients =
            new ConcurrentDictionary<IBus, FleetKeeperClient>();

        public static RebusConfigurer InstallFleetKeeper(this RebusConfigurer configurer)
        {
            configurer.Events(events => events.BusStarted += bus =>
            {
                var client = new FleetKeeperClient(bus, IPAddress.Loopback, 8001);
                if (!clients.TryAdd(bus, client))
                    throw new InvalidOperationException("Somehow this bus already has a FleetKeeper client attached. " +
                                                        "That should only be possible if you've started the same bus instance on two different threads simultanously. " +
                                                        "Please don't do that.");

                client.Start();
            });

            //TODO: BusStopped => Dispose
            return configurer;
        }
    }

    public class Diagnostics
    {
        public int NumberOfMessagesInQueue { get; set; }
    }

}
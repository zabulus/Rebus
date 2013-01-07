using System;
using System.Reactive.Linq;

namespace Rebus.FleetKeeper
{
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
            tcpServer.Start();
            httpServer.Start();
            Console.ReadLine();
        }

        public void Dispose()
        {
            
        }
    }
}
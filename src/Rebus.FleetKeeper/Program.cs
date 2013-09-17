using System;
using System.Configuration;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin.Hosting;

namespace Rebus.FleetKeeper
{
    public class Program
    {
        public static int Main()
        {
            var url = ConfigurationManager.AppSettings["listenUri"];
            using (WebApp.Start<Startup>(url))
            {
                Console.WriteLine("FleetKeeper is listening on {0}", url);
                while (true)
                {
                    var name = Console.ReadLine();
                    var context = GlobalHost.ConnectionManager.GetHubContext<FleetKeeperHub>();
                    context.Clients.All.addEndpoint(name);
                }
            }

            return 0;
        }
    }
}
using System;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Microsoft.Owin.Hosting;

namespace Rebus.FleetKeeper
{
    public class Program
    {
        public static int Main()
        {
            var url = "http://localhost:8080";
            using (WebApp.Start<Startup>(url))
            {
                Console.WriteLine("FleetKeeper is running on {0}", url);
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

    public class FleetKeeperHub : Hub
    {
        public void AddEndpoint(string name)
        {
            Clients.All.addEndpoint(name);
        }
    }

    public class LoggerMiddleware : OwinMiddleware
    {
        public LoggerMiddleware(OwinMiddleware next) : base(next) {}

        public override Task Invoke(OwinRequest request, OwinResponse response)
        {
            Console.WriteLine("Here");
            return Next.Invoke(request, response);
        }
    }
}
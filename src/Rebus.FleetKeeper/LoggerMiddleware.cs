using System;
using System.Threading.Tasks;
using Microsoft.Owin;

namespace Rebus.FleetKeeper
{
    public class LoggerMiddleware : OwinMiddleware
    {
        public LoggerMiddleware(OwinMiddleware next) : base(next) {}

        public override Task Invoke(OwinRequest request, OwinResponse response)
        {
            Console.WriteLine(request.Uri.ToString());
            return Next.Invoke(request, response);
        }
    }
}
using System;
using System.Threading.Tasks;
using Microsoft.Owin;

namespace Rebus.FleetKeeper
{
    public class LoggerMiddleware : OwinMiddleware
    {
        public LoggerMiddleware(OwinMiddleware next) : base(next) {}

        public override Task Invoke(IOwinContext context)
        {
            Console.WriteLine(context.Request.Uri.ToString());
            return Next.Invoke(context);
        }
    }
}
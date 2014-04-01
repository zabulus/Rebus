using System.Reflection;
using System.Threading.Tasks;
using log4net;
using Microsoft.Owin;

namespace Rebus.FleetKeeper.Http
{
    public class LoggerMiddleware : OwinMiddleware
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        public LoggerMiddleware(OwinMiddleware next) : base(next) {}

        public override Task Invoke(IOwinContext context)
        {
            Log.DebugFormat("Request: {0}", context.Request.Uri);
            
            return Next.Invoke(context);
        }
    }
}
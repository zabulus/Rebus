using System.IO;
using System.Reflection;
using Microsoft.AspNet.SignalR;
using Owin;

namespace Rebus.FleetKeeper
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var config = new HubConfiguration();
            app.MapSignalR(config);
            
            var exeFolder = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            var webFolder = Path.Combine(exeFolder, "Web");

            app.Use(typeof(LoggerMiddleware));
            app.UseStaticFiles(webFolder);
        }
    }
}
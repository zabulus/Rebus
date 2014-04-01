using System.IO;
using System.Reflection;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using Owin;

//new SQLiteConnection("Data Source=fleetkeeper.db;Version=3;New=False;Compress=True;")

namespace Rebus.FleetKeeper.Http
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var config = new HubConfiguration();
            var serializer = new JsonSerializer
            {
                ContractResolver = new SignalRContractResolver()
            };
            config.Resolver.Register(typeof (JsonSerializer), () => serializer);

            app.MapSignalR(config);

            var exeFolder = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            var webFolder = Path.Combine(exeFolder, "Web");

            app.Use(typeof (LoggerMiddleware));
            app.UseStaticFiles(webFolder);
        }
    }
}
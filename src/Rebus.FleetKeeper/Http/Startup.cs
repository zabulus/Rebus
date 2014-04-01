using System;
using System.IO;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using System.Reflection;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using Owin;
using Rebus.FleetKeeper.Messages;

//new SQLiteConnection("Data Source=fleetkeeper.db;Version=3;New=False;Compress=True;")
namespace Rebus.FleetKeeper.Http
{
    public class Startup
    {
        Subject<Event> observer;

        public void Configuration(IAppBuilder app)
        {
            observer = new Subject<Event>();
            observer.Synchronize().Subscribe(Console.WriteLine);
            
            var config = new HubConfiguration();
            var serializer = new JsonSerializer
            {
                ContractResolver = new SignalRContractResolver()
            };
            config.Resolver.Register(typeof (JsonSerializer), () => serializer);
            config.Resolver.Register(typeof(RebusHub), () => new RebusHub(observer));

            app.MapSignalR(config);

            var exeFolder = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            var webFolder = Path.Combine(exeFolder, "Web");

            app.Use(typeof (LoggerMiddleware));
            app.UseStaticFiles(webFolder);
        }
    }
}
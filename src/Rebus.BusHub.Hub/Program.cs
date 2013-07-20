using System;
using System.Configuration;
using System.IO;
using Topshelf;
using Topshelf.Runtime;
using log4net.Config;

namespace Rebus.BusHub.Hub
{
    class Program
    {
        static void Main()
        {
            XmlConfigurator.ConfigureAndWatch(new FileInfo(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log4net.config")));

            HostFactory
                .Run(s =>
                {
                    const string text = "Rebus BusHub Service";

                    s.SetDescription("Rebus Bus Hub Service - Install named instance by adding '/instance:\"myInstance\"' when installing.");
                    s.SetDisplayName(text);
                    s.SetInstanceName("default");
                    s.SetServiceName("rebus_bushub_service");
                    s.UseLog4Net();

                    s.Service<BusHubService>(c =>
                    {
                        c.ConstructUsing(CreateBusHubService);
                        c.WhenStarted(t => t.Start());
                        c.WhenStopped(t => t.Stop());
                    });

                    s.DependsOnMsmq();
                });
        }

        static BusHubService CreateBusHubService(HostSettings settings)
        {
            var url = ConfigurationManager.AppSettings["listenUri"];

            if (string.IsNullOrEmpty(url))
            {
                throw new ArgumentException(
                    @"No URL specified! You need to configure the SignalR hub URL in app.config, e.g. like this:

  <appSettings>
    <add key=""listenUri"" value=""http://+:10000/""/>
  </appSettings>

      ");
            }

            return new BusHubService(url);
        }
    }
}

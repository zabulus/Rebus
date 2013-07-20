using System;
using System.Configuration;
using System.Reflection;
using Microsoft.Owin.Hosting;
using log4net;

namespace Rebus.BusHub.Hub
{
    class BusHubService
    {
        static IDisposable webApp;

        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        public void Start()
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

            try
            {
                Log.InfoFormat("Starting up on {0}...", url);
                
                webApp = WebApplication.Start<Startup>(url);
                
                Log.InfoFormat("Server listening!");
            }
            catch (Exception e)
            {
                throw new ApplicationException(
                    string.Format("An error occurred while attempting to open SignalR hub on {0}",
                                  url), e);
            }
        }

        public void Stop()
        {
            Log.Info("Shutting down server...");

            webApp.Dispose();

            Log.Info("Server stopped!");
        }
    }
}
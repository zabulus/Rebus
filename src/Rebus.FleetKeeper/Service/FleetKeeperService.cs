using System;
using System.Configuration;
using System.Reflection;
using System.ServiceProcess;
using Microsoft.Owin.Hosting;
using log4net;

namespace Rebus.FleetKeeper.Service
{
    partial class FleetKeeperService : ServiceBase
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        public const string FullFleetKeeperServiceName = "Rebus FleetKeeper";
        public const string FleetKeeperServiceName = "FleetKeeper";

        IDisposable webApp;

        static readonly object ShutDownLock = new object();
        static volatile bool shuttingDown;

        public FleetKeeperService()
        {
            InitializeComponent();
        }

        public static void RunAsConsole(string[] args)
        {
            Console.WriteLine("Press 'q' or 'ctrl+c' to exit.");

            var fleetKeeperService = new FleetKeeperService();

            Signals.CtrlCPressed += () => ShutDownInteractive(fleetKeeperService);
            Signals.CtrlBreakPressed += () => ShutDownInteractive(fleetKeeperService);

            fleetKeeperService.OnStart(args);

            Console.CancelKeyPress += delegate { fleetKeeperService.OnStop(); };

            while (true)
            {
                var line = Console.ReadLine();
                if (line == "q")
                    break;
            }

            fleetKeeperService.OnStop();
        }

        static void ShutDownInteractive(FleetKeeperService fleetKeeperService)
        {
            if (shuttingDown) return;

            lock (ShutDownLock)
            {
                if (shuttingDown) return;

                shuttingDown = true;

                fleetKeeperService.OnStop();
                Environment.Exit(0);
            }
        }

        protected override void OnStart(string[] args)
        {
            var url = ConfigurationManager.AppSettings["listenUri"];
            webApp = WebApp.Start<Startup>(url);

            Log.InfoFormat("FleetKeeper is listening on {0}", url);
        }

        protected override void OnStop()
        {
            var disposable = webApp;

            if (disposable != null)
            {
                webApp = null;

                Log.Info("Shutting down FleetKeeper");

                disposable.Dispose();
            }
        }
    }
}
using System;
using System.Configuration;
using System.Linq;
using System.Runtime.InteropServices;
using System.ServiceProcess;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin.Hosting;

namespace Rebus.FleetKeeper.Service
{
    partial class Service : ServiceBase
    {
        // Declare the SetConsoleCtrlHandler function
        // as external and receiving a delegate.
        [DllImport("Kernel32")]
        public static extern bool SetConsoleCtrlHandler(HandlerRoutine handler, bool add);

        // A delegate type to be used as the handler routine 
        // for SetConsoleCtrlHandler.
        public delegate bool HandlerRoutine(CtrlTypes ctrlType);

        // An enumerated type for the control messages
        // sent to the handler routine.
        public enum CtrlTypes
        {
            CTRL_C_EVENT = 0,
            CTRL_BREAK_EVENT,
            CTRL_CLOSE_EVENT,
            CTRL_LOGOFF_EVENT = 5,
            CTRL_SHUTDOWN_EVENT
        }

        public const string FullFleetKeeperServiceName = "Rebus FleetKeeper";
        public const string FleetKeeperServiceName = "FleetKeeper";

        IDisposable webApp;

        public Service()
        {
            InitializeComponent();
        }

        static void Main(string[] args)
        {
            var service = new Service();

            switch (args.FirstOrDefault())
            {
                case "-h":
                    Console.WriteLine("Service.exe [-i(nstall)|-u(ninstall)|-c(onsole)]");
                    break;

                case "-i":
                case "install":
                    ServiceInstaller.Install(args);
                    break;

                case "-u":
                case "uninstall":
                    ServiceInstaller.Uninstall(args);
                    break;

                case "-c":
                case "console":
                    RunAsConsole(args);
                    break;

                default:
                    if (Environment.UserInteractive)
                    {
                        RunAsConsole(args);
                        return;
                    }
                    
                    Run(service);
                    break;

            }
        }

        static void RunAsConsole(string[] args)
        {
            Console.WriteLine("Press 'q' or 'ctrl+c' to exit.");

            var service = new Service();

            SetConsoleCtrlHandler(type =>
                {
                    service.OnStop();
                    Environment.Exit(0);
                    return false;
                }, true);

            service.OnStart(args);

            Console.CancelKeyPress += delegate { service.OnStop(); };
            while (true)
            {
                var line = Console.ReadLine();
                if (line == "q")
                    break;
            }

            service.OnStop();
        }

        protected override void OnStart(string[] args)
        {
            var url = ConfigurationManager.AppSettings["listenUri"];
            webApp = WebApp.Start<Startup>(url);

            Console.WriteLine("FleetKeeper is listening on {0}", url);
        }

        protected override void OnStop()
        {
            var disposable = webApp;

            if (disposable != null)
            {
                webApp = null;

                Console.WriteLine("Shutting down FleetKeeper");
                disposable.Dispose();
            }
        }
    }
}
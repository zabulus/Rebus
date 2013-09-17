using System;
using System.Linq;
using System.ServiceProcess;
using Castle.Core.Logging;
using Castle.Windsor;
using Castle.Windsor.Installer;
using Energy10.Infrastructure.Windsor;

namespace Energy10.BeCalculator
{
    partial class Service : ServiceBase
    {
        WindsorContainer container;
        ILogger logger;

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
                case "-install":
                    ServiceInstaller.Install(args);
                    break;
                case "-u":
                case "-uninstall":
                    ServiceInstaller.Uninstall(args);
                    break;
                case "-c":
                case "-console":
                    RunAsConsole(args);
                    break;
                default:
                    Run(service);
                    break;

            }
        }

        static void RunAsConsole(string[] args)
        {
            Console.WriteLine("Press 'q' or 'ctrl+c' to exit.");

            var service = new Service();
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
            container = new WindsorContainer();
            container.Install(new WindsorInstaller());

            logger = container.Resolve<ILogger>();
            logger.Info("Starting BeCalculator");
            container.Install(FromAssembly.This());
            logger.Info("BeCalculator started");
        }

        protected override void OnStop()
        {
            container.Dispose();
            logger.Info("BeCalculator stopped");
        }
    }
}
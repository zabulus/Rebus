using System;
using System.IO;
using System.Linq;
using System.ServiceProcess;
using Rebus.FleetKeeper.Service;
using log4net.Config;
using ServiceInstaller = Rebus.FleetKeeper.Service.ServiceInstaller;

namespace Rebus.FleetKeeper
{
    public class Program
    {
        static void Main(string[] args)
        {
            var configFile = new FileInfo(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log4net.config"));
            if (!configFile.Exists)
            {
                Console.WriteLine("In order to enable logging, please create a log4net.config file and place it next to Rebus.FleetKeeper.exe");
            }
            
            XmlConfigurator.ConfigureAndWatch(configFile);

            var service = new FleetKeeperService();

            switch (args.FirstOrDefault())
            {
                case "-h":
                    Console.WriteLine("Rebus.FleetKeeper.exe [-i(nstall)|-u(ninstall)|-c(onsole)]");
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
                    FleetKeeperService.RunAsConsole(args);
                    break;

                default:
                    if (Environment.UserInteractive)
                    {
                        FleetKeeperService.RunAsConsole(args);
                        return;
                    }
                    
                    ServiceBase.Run(service);
                    break;

            }
        }
    }
}
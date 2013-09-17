using System;
using System.Linq;
using System.ServiceProcess;
using Rebus.FleetKeeper.Service;
using ServiceInstaller = Rebus.FleetKeeper.Service.ServiceInstaller;

namespace Rebus.FleetKeeper
{
    public class Program
    {
        static void Main(string[] args)
        {
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
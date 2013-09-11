using System;
using System.Collections.Generic;
using Rebus.Configuration;
using Rebus.Transports.Msmq;

namespace Rebus.FleetKeeper.Client
{
    public class Program
    {
        static readonly Dictionary<string, IBus> busses = new Dictionary<string, IBus>();

        static void Main()
        {
            Console.WriteLine("Rebus FleetKeeper Test Console");
            WriteHelp();

            using (var adapter = new BuiltinContainerAdapter())
            {
                adapter.Register(typeof (Program));

                var keepRunning = true;
                do
                {
                    var line = Console.ReadLine() ?? "";
                    var words = line.Split(' ');
                    if (words[0] == "start" && words[1] == "bus")
                    {
                        var name = words[2];

                        var bus = Configure.With(adapter)
                                 .Transport(t => t.UseMsmq(name + ".test", name + ".test.error"))
                                 .MessageOwnership(d => d.FromRebusConfigurationSection())
                                 .EnableFleetKeeper("http://localhost:8080")
                                 .CreateBus()
                                 .Start();

                        busses.Add(name, bus);
                    }
                    else if (line.StartsWith("stop bus"))
                    {
                        var name = words[2];

                        IBus bus;
                        if (busses.TryGetValue(name, out bus))
                        {
                            busses.Remove(name);
                            bus.Dispose();
                        }
                        else
                        {
                            Console.WriteLine("No bus named '{0}' was found", name);
                        }
                    }
                    else if (line == "h" || line == "help")
                    {
                        WriteHelp();
                    }
                    else if (line == "q" || line == "quit")
                    {
                        keepRunning = false;
                    }
                } while (keepRunning);
            }
        }

        static void WriteHelp()
        {
            Console.WriteLine(@"
Use the following commands to control the process:

    start bus <name>            - starts a bus with queues named {name}.test 
                                  and {name}.test.error
    stop bus <name>             - stops the bus with the given name
    set fleetkeeper url=<url>   - setup the client to use this url for any 
                                  _new_ bus, defaults to http://localhost:8080
");
        }

        public void Handle(string message)
        {
            Console.WriteLine("Got message: {0}", message);
        }
    }
}
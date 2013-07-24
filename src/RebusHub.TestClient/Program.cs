using System;
using Rebus;
using Rebus.BusHub.Client;
using Rebus.Configuration;
using Rebus.Transports.Msmq;

namespace RebusHub.TestClient
{
    class Program : IHandleMessages<string>
    {
        static readonly Random Random = new Random();

        static void Main()
        {
            using (var adapter = new BuiltinContainerAdapter())
            {
                adapter.Register(typeof (Program));

                Configure.With(adapter)
                         .Transport(t => t.UseMsmqAndGetInputQueueNameFromAppConfig())
                         .MessageOwnership(d => d.FromRebusConfigurationSection())
                         .ConnectToBusHub("http://localhost:10000")
                         .CreateBus()
                         .Start();

                var keepRunning = true;
                do
                {
                    Console.WriteLine(@"Press 

    a) to send a message to self
    b) to send batch messages to self
    q) to quit

");

                    var key = Console.ReadKey();

                    switch (char.ToLower(key.KeyChar))
                    {
                        case 'a':
                            adapter.Bus.Send("hello world!! " + new string('*', Random.Next(10) + 1));
                            break;

                        case 'b':
                            adapter.Bus.Advanced.Batch.Send(new[] {"hello", "there", "my", "friend"});
                            break;

                        case'q':
                            keepRunning = false;
                            break;
                    }
                } while (keepRunning);
            }
        }

        public void Handle(string message)
        {
            Console.WriteLine("Got message: {0}", message);
        }
    }
}

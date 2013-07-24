using System;
using Rebus.BusHub.Client;
using Rebus.Configuration;
using Rebus.Transports.Msmq;

namespace RebusHub.TestClient
{
    class Program
    {
        static void Main()
        {
            using (var adapter = new BuiltinContainerAdapter())
            {
                Configure.With(adapter)
                         .Transport(t => t.UseMsmqAndGetInputQueueNameFromAppConfig())
                         .ConnectToBusHub("http://localhost:10000")
                         .CreateBus()
                         .Start();

                Console.WriteLine("Press ENTER to quit");
                Console.ReadLine();
            }
        }
    }
}

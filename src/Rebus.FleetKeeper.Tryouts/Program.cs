using Rebus.Configuration;
using Rebus.Transports.Msmq;

namespace Rebus.FleetKeeper.Tryouts
{
    class Program
    {
        static void Main(string[] args)
        {
            var bus = Configure.With(new BuiltinContainerAdapter())
                               .Transport(x => x.UseMsmq("fleetkeeper", "fleetkeeper.errors"))
                               .InstallFleetKeeper()
                               .CreateBus()
                               .Start();

        }
    }
}

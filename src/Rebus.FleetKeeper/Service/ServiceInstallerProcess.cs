using System.ComponentModel;
using System.ServiceProcess;

namespace Rebus.FleetKeeper.Service
{
    [RunInstaller(true)]
    public sealed class ServiceInstallerProcess : ServiceProcessInstaller
    {
        public ServiceInstallerProcess()
        {
            Account = ServiceAccount.LocalSystem;
        }
    }
}
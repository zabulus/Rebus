using System.ComponentModel;
using System.ServiceProcess;

namespace Energy10.BeCalculator
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
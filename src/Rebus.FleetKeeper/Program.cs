using Rebus.Configuration;

namespace Rebus.FleetKeeper
{
    class Program
    {
        static void Main(string[] args)
        {
        }
    }

    public static class BusExtensions
    {
        public static RebusConfigurer InstallFleetKeeper(this RebusConfigurer configurer)
        {
            return configurer;
        }
    }
}

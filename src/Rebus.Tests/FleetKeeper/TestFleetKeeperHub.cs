using NUnit.Framework;
using Rebus.Configuration;
using Rebus.FleetKeeper.Client;

namespace Rebus.Tests.FleetKeeper
{
    public class TestFleetKeeperHub
    {
        [Test]
        public void Test()
        {
            Configure.With(new BuiltinContainerAdapter())
                     .Logging(x => { })
                     .EnableFleetKeeper("http://localhost:8080");
        }
    }
}
using NUnit.Framework;
using Rebus.BusHub.Hub;

namespace Rebus.BusHub.Tests
{
    [TestFixture]
    public class BasicBusHubTests : FixtureFor<BusHubService>
    {
        protected override BusHubService SetUpInstance()
        {
            return new BusHubService("http://+:24000/");
        }

        [Test]
        public void CanStart()
        {
            try
            {
                instance.Start();
            }
            finally
            {
                instance.Stop();
            }
        }
    }
}

using NUnit.Framework;
using Rebus.BusHub.Hub.Handlers;
using Rebus.BusHub.Hub.Views;
using System.Linq;
using Rebus.BusHub.Messages;
using Rebus.BusHub.Messages.Causal;
using Shouldly;

namespace Rebus.BusHub.Tests.Views
{
    [TestFixture]
    public class TestBusTopologyView : ViewFixture<IBusTopologyView>
    {
        protected override IBusTopologyView SetUpView()
        {
            return new BusTopology();
        }

        [Test]
        public void StartsOutWithEmptyList()
        {
            // arrange
            // tumbleweeds....            

            // act
            var busInstances = View.GetBusInstances();

            // assert
            busInstances.Count()
                        .ShouldBe(0);
        }

        [Test]
        public void CanKeepTrackOfBusInstanceStatus()
        {
            // arrange
            Dispatch(new BusHasBeenStarted
                         {
                             ClientId = "someId",
                             InputQueueAddress = "someQueue@someMachine"
                         });

            // act
            var busInstances = View.GetBusInstances().ToList();

            // assert
            busInstances.Count.ShouldBe(1);
            var busInstance = busInstances.Single();
            busInstance.InputQueueAddress.ShouldBe("someQueue@someMachine");
        }
    }
}
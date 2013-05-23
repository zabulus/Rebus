using System.Collections;
using System.Collections.Generic;
using Rebus.Configuration;

namespace Rebus.Tests
{
    /// <summary>
    /// Container adapter that just wraps an implementation of <see cref="IActivateHandlers"/>
    /// </summary>
    class FakeContainerAdapter : IContainerAdapter
    {
        readonly IActivateHandlers handlerActivator;

        public FakeContainerAdapter(IActivateHandlers handlerActivator)
        {
            this.handlerActivator = handlerActivator;
        }

        public IEnumerable<IHandleMessages<T>> GetHandlerInstancesFor<T>()
        {
            return handlerActivator.GetHandlerInstancesFor<T>();
        }

        public void Release(IEnumerable handlerInstances)
        {
            handlerActivator.Release(handlerInstances);
        }

        public void SaveBusInstances(IBus bus)
        {
        }
    }
}
using System;
using NUnit.Framework;
using Rebus.BusHub.Hub;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Tests
{
    public abstract class ViewFixture<TView>
    {
        [SetUp]
        public void SetUp()
        {
            View = SetUpView();
        }

        protected abstract TView SetUpView();

        protected TView View { get; private set; }

        protected void Dispatch<T>(T busHubMessage) where T : BusHubMessage
        {
            var handler = View as IMessageHandler<T>;

            if (handler == null)
            {
                throw new AssertionException(string.Format("Could not cast {0} to IMessageHandler<{1}>!",
                                                           View, typeof (T).Name));
            }

            handler.Handle(busHubMessage);

            //var messageType = typeof (T);
            //var handlerMethod = View
            //    .GetType()
            //    .GetMethod("Handle", new[] {messageType});

            //if (handlerMethod == null)
            //{
            //    throw new AssertionException(string.Format("Could not find 'Handle' method that accepts a {0} as its argument!",
            //        messageType));
            //}

            //handlerMethod.Invoke(View, new object[] {busHubMessage});
        }
    }
}
using System;

namespace Rebus.Tests.Contracts.Transports.Factories
{
    public interface ITransportFactory : IDisposable
    {
        Tuple<ISendMessages, IReceiveMessages> Create();
        IReceiveMessages CreateReceiver(string queueName);
    }
}
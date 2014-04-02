using System;
using Rebus.Tests.Persistence;
using Rebus.Transports.Sql;

namespace Rebus.Tests.Contracts.Transports.Factories
{
    public class SqlServerTransportFactory : SqlServerFixtureBase, ITransportFactory
    {
        const string MessageTableName = "#messages2";

        public Tuple<ISendMessages, IReceiveMessages> Create()
        {
            var sender = GetQueue("test.contracts.sender");
            var receiver = GetQueue("test.contracts.receiver");

            return Tuple.Create<ISendMessages, IReceiveMessages>(sender, receiver);
        }

        public IReceiveMessages CreateReceiver(string queueName)
        {
            return GetQueue(queueName);
        }

        IDuplexTransport GetQueue(string inputQueueName)
        {
            var queue = new SqlServerMessageQueue(GetOrCreateConnection, MessageTableName, inputQueueName)
                .EnsureTableIsCreated()
                .PurgeInputQueue();

            return queue;
        }
    }
}
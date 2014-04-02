using System;
using System.Data.SqlClient;
using Rebus.Persistence.SqlServer;
using log4net.Config;
using System.Linq;

namespace Rebus.Tests.Persistence.Subscriptions.Factories
{
    public class SqlServerSubscriptionStoreFactory : SqlServerFixtureBase, ISubscriptionStoreFactory
    {
        static SqlServerSubscriptionStoreFactory()
        {
            XmlConfigurator.Configure();
        }

        public IStoreSubscriptions CreateStore()
        {
            return new SqlServerSubscriptionStorage(GetOrCreateConnection, SubscriptionTableName)
                .EnsureTableIsCreated();
        }

        public void Dispose()
        {
            TearDown();
        }
    }
}
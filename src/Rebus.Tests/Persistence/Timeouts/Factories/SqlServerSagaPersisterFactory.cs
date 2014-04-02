using System.Data.SqlClient;
using Rebus.Persistence.SqlServer;
using Rebus.Timeout;
using log4net.Config;

namespace Rebus.Tests.Persistence.Timeouts.Factories
{
    public class SqlServerTimeoutStorageFactory : SqlServerFixtureBase, ITimeoutStorageFactory
    {
        static SqlServerTimeoutStorageFactory()
        {
            XmlConfigurator.Configure();
        }

        public IStoreTimeouts CreateStore()
        {
            return new SqlServerTimeoutStorage(GetOrCreateConnection, TimeoutTableName).EnsureTableIsCreated();
        }
    }
}
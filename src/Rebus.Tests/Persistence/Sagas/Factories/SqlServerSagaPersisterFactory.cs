using Rebus.Persistence.SqlServer;
using log4net.Config;

namespace Rebus.Tests.Persistence.Sagas.Factories
{
    public class SqlServerSagaPersisterFactory : SqlServerFixtureBase, ISagaPersisterFactory
    {
        static SqlServerSagaPersisterFactory()
        {
            XmlConfigurator.Configure();
        }

        public IStoreSagaData CreatePersister()
        {
            SetUp();
            var sqlServerSagaPersister = new SqlServerSagaPersister(GetOrCreateConnection, SagaIndexTableName, SagaTableName);
            sqlServerSagaPersister.EnsureTablesAreCreated();
            return sqlServerSagaPersister;
        }
    }
}
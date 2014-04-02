using NUnit.Framework;
using Rebus.Persistence.SqlServer;
using Shouldly;

namespace Rebus.Tests.Persistence.SqlServer
{
    [TestFixture, Category(TestCategories.MsSql)]
    public class TestSqlServerTimeoutStorage : SqlServerFixtureBase
    {
        SqlServerTimeoutStorage storage;
        const string TimeoutsTableName = "#timeouts";

        protected override void DoSetUp()
        {
            storage = new SqlServerTimeoutStorage(GetOrCreateConnection, TimeoutsTableName);
        }

        [Test]
        public void CanCreateStorageTableAutomatically()
        {
            // arrange

            // act
            storage.EnsureTableIsCreated();

            // assert
            var tableNames = GetTableNames();
            tableNames.ShouldContain(TimeoutsTableName);
        }

        [Test]
        public void DoesntDoAnythingIfTheTableAlreadyExists()
        {
            // arrange
            ExecuteCommand("create table " + TimeoutsTableName + "(id int not null)");

            // act
            // assert
            storage.EnsureTableIsCreated();
            storage.EnsureTableIsCreated();
            storage.EnsureTableIsCreated();
        }
    }
}
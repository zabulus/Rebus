using System;
using NUnit.Framework;
using Rebus.Persistence.SqlServer;
using Shouldly;

namespace Rebus.Tests.Persistence.SqlServer
{
    [TestFixture, Category(TestCategories.MsSql)]
    public class TestSqlServerSagaPersister_UserProvidedConnection : SqlServerFixtureBase
    {
        SqlServerSagaPersister persister;

        protected override void DoSetUp()
        {
            persister = new SqlServerSagaPersister(GetOrCreateConnection, SagaIndexTableName, SagaTableName);
            persister.EnsureTablesAreCreated();
        }


        [Test]
        public void WorksWithUserProvidedConnectionWithStartedTransaction()
        {
            // arrange
            var sagaId = Guid.NewGuid();
            var sagaData = new SomeSagaData { JustSomething = "hey!", Id = sagaId };

            // act
            BeginTransaction();

            // assert
            persister.Insert(sagaData, new string[0]);

            CommitTransaction();
        }

        [Test]
        public void WorksWithUserProvidedConnectionWithoutStartedTransaction()
        {
            // arrange
            var sagaId = Guid.NewGuid();
            var sagaData = new SomeSagaData { JustSomething = "hey!", Id = sagaId };

            // act

            // assert
            persister.Insert(sagaData, new string[0]);

        }

        class SomeSagaData : ISagaData
        {
            public Guid Id { get; set; }
            public int Revision { get; set; }
            public string JustSomething { get; set; }
        }

        [Test]
        public void CanCreateSagaTablesAutomatically()
        {
            // arrange

            // act
            persister.EnsureTablesAreCreated();

            // assert
            var existingTables = GetTableNames();
            existingTables.ShouldContain(SagaIndexTableName);
            existingTables.ShouldContain(SagaTableName);
        }
    }
}
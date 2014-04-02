using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using NUnit.Framework;
using Rebus.Configuration;
using Rebus.Persistence.SqlServer;
using Rebus.Transports.Msmq;
using log4net.Config;
using System.Linq;
using Rebus.Transports.Sql;

namespace Rebus.Tests.Persistence
{
    public abstract class SqlServerFixtureBase : FixtureBase, IDetermineMessageOwnership, IDisposable
    {
        SqlConnection currentConnection;
        SqlTransaction currentTransaction;

        protected const string SagaTableName = "#testSagaTable";
        protected const string SagaIndexTableName = "#testSagaIndexTable";
        protected const string SubscriptionTableName = "#testSubscriptionTable";
        protected const string TimeoutTableName = "#testTimeoutTable";

        protected const string ErrorQueueName = "error";
        
        static SqlServerFixtureBase()
        {
            XmlConfigurator.Configure();
        }
 
        [TearDown]
        public void TearDown()
        {
            base.TearDown();
            DisposeConnection();
            DoTearDown();
            CleanUpTrackedDisposables();
        }

        public void Dispose()
        {
            DisposeConnection();
        }

        protected ConnectionHolder GetOrCreateConnection()
        {
            if (currentConnection != null)
            {
                return currentTransaction == null
                    ? ConnectionHolder.ForNonTransactionalWork(currentConnection)
                    : ConnectionHolder.ForTransactionalWork(currentConnection, currentTransaction);
            }

            var newConnection = new SqlConnection(ConnectionStrings.SqlServer);
            newConnection.Open();
            currentConnection = newConnection;

            return ConnectionHolder.ForNonTransactionalWork(newConnection);
        }

        void DisposeConnection()
        {
            if (currentConnection != null)
            {
                currentConnection.Dispose();
                currentConnection = null;
            }
        }

        protected void BeginTransaction()
        {
            if (currentTransaction != null)
            {
                throw new InvalidOperationException("Cannot begin new transaction when a transaction has already been started!");
            }
            currentTransaction = GetOrCreateConnection().Connection.BeginTransaction();
        }

        protected void CommitTransaction()
        {
            if (currentTransaction == null)
            {
                throw new InvalidOperationException("Cannot commit transaction when no transaction has been started!");
            }
            currentTransaction.Commit();
            currentTransaction = null;
        }

        public List<string> GetTableNames()
        {
            return GetOrCreateConnection().GetTableNames();
        }

        public void ExecuteCommand(string commandText)
        {
            var conn = GetOrCreateConnection();
            using (var command = conn.CreateCommand())
            {
                command.CommandText = commandText;
                command.ExecuteNonQuery();
            }
        }

        public object ExecuteScalar(string commandText)
        {
            var conn = GetOrCreateConnection();
            using (var command = conn.CreateCommand())
            {
                command.CommandText = commandText;
                return command.ExecuteScalar();
            }
        }

        protected T TrackDisposable<T>(T disposable) where T : IDisposable
        {
            DisposableTracker.TrackDisposable(disposable);
            return disposable;
        }

        protected void CleanUpTrackedDisposables()
        {
            DisposableTracker.DisposeTheDisposables();
        }

        public virtual string GetEndpointFor(Type messageType)
        {
            return null;
        }
    }
}
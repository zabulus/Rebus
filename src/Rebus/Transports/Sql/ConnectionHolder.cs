using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using Rebus.Persistence.SqlServer;

namespace Rebus.Transports.Sql
{
    public class SqlServerStore
    {
        readonly string connectionstring;
        readonly ConnectionMode mode;
        int numberOfManagedConnections;

        SqlServerStore(string connectionstring, ConnectionMode mode)
        {
            this.connectionstring = connectionstring;
            this.mode = mode;
        }

        public static SqlServerStore Transient(string connectionstring)
        {
            return new SqlServerStore(connectionstring, ConnectionMode.Transient);
        }

        public ConnectionHolder Connect()
        {
            Action complete = () => { };
            Action dispose = () => { numberOfManagedConnections--; };

            SqlConnection connection = null;
            switch (mode)
            {
                case ConnectionMode.Transient:
                    connection = new SqlConnection(connectionstring);
                    connection.Open();
                    
                    complete = connection.Dispose + complete;
                    dispose = connection.Dispose + dispose;
                    break;
                case ConnectionMode.Ambient:
                    break;
                case ConnectionMode.Testing:
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

            //if (currentConnection != null)
            //{
            //    return currentTransaction == null
            //        ? ConnectionHolder.ForNonTransactionalWork(currentConnection)
            //        : ConnectionHolder.ForTransactionalWork(currentConnection, currentTransaction);
            //}
            //currentConnection = newConnection;
            return new ConnectionHolder(connection, null, complete, dispose);
        }

        public bool TableExists(string tablename)
        {
            using (var connection = Connect())
            using (var command = connection.CreateCommand())
            {
                command.CommandText = GetTableExistsSql(tablename);

                using (var reader = command.ExecuteReader())
                {
                    reader.Read();
                    return (bool) reader[0];
                }
            }
        }

        string GetTableExistsSql(string tablename)
        {
            return string.Format(mode == ConnectionMode.TempTables
                ? "OBJECT_ID('tempdb..{0}') is not null"
                : "exists (select * from information_schema.tables where table_catalog = db_name() and table_name = '{0}')",
                tablename);
        }

        enum ConnectionMode
        {
            Transient,
            Ambient,
            TempTables
        }
    }

    /// <summary>
    /// Provides an opened and ready-to-use <see cref="SqlConnection"/> for doing stuff in SQL Server.
    /// Construct
    /// </summary>
    public class ConnectionHolder : IDisposable
    {
        readonly SqlConnection connection;
        readonly SqlTransaction transaction;
        readonly Action complete;
        readonly Action dispose;

        /// <summary>
        /// Constructs a <see cref="ConnectionHolder"/> instance with the given connection. The connection
        /// will be used for non-transactional work
        /// </summary>
        public static ConnectionHolder ForNonTransactionalWork(SqlConnection connection)
        {
            if (connection == null) throw new ArgumentNullException("connection");
            return new ConnectionHolder(connection, null, () => { }, () => { });
        }

        /// <summary>
        /// Constructs a <see cref="ConnectionHolder"/> instance with the given connection and transaction. The connection
        /// will be used for transactional work
        /// </summary>
        public static ConnectionHolder ForTransactionalWork(SqlConnection connection, SqlTransaction transaction)
        {
            if (connection == null) throw new ArgumentNullException("connection");
            if (transaction == null) throw new ArgumentNullException("transaction");
            return new ConnectionHolder(connection, transaction, () => { }, () => { });
        }

        public ConnectionHolder(SqlConnection connection, SqlTransaction transaction, Action complete, Action dispose)
        {
            this.complete = complete;
            this.dispose = dispose;
            this.connection = connection;
            this.transaction = transaction;
        }

        /// <summary>
        /// Creates a new <see cref="SqlCommand"/>, setting the transaction if necessary
        /// </summary>
        public SqlCommand CreateCommand()
        {
            var sqlCommand = connection.CreateCommand();
            
            if (transaction != null)
            {
                sqlCommand.Transaction = transaction;
            }
            
            return sqlCommand;
        }

        /// <summary>
        /// Ensures that the ongoing transaction is disposed and the held connection is disposed
        /// </summary>
        public void Dispose()
        {
            if (transaction != null)
            {
                transaction.Dispose();
            }
            
            connection.Dispose();
        }

        /// <summary>
        /// Commits the transaction if one is present
        /// </summary>
        public void Commit()
        {
            if (transaction == null) return;
            
            transaction.Commit();
        }  
        
        /// <summary>
        /// Commits the transaction if one is present
        /// </summary>
        public SqlTransaction BeginTransaction()
        {
            if (transaction != null) 
                return transaction;
            
            return connection.BeginTransaction();
        }

        /// <summary>
        /// Rolls back the transaction is one is present
        /// </summary>
        public void RollBack()
        {
            if (transaction == null) return;

            transaction.Rollback();
        }

        /// <summary>
        /// Queries sys.Tables in the current DB
        /// </summary>
        public List<string> GetTableNames()
        {
            return connection.GetTableNames(transaction);
        }
    }
}
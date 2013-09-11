using System.Data.SQLite;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNet.SignalR;

namespace Rebus.FleetKeeper
{
    public class FleetKeeperHub : Hub
    {
        readonly SQLiteConnection dbConnection;
        /* On fk web client connect get a snapshot of the current status from persistence
         * 
         * When a fk server get snapshot from all busses that can gve them
         * When a bus is started get snapshot from bus
         * 
         * Snapshot: number of messages currently in inputqueue and error queue that are for this bus
         * 
         * 
         * Bus started
         * Transport message received
         * Message handled/failed
         * Message failed
         * Bus stopped
         * Log appended
         *
         *
         * 
         */

        public FleetKeeperHub()
        {
            dbConnection = new SQLiteConnection("Data Source=fleetkeeper.db;Version=3;New=False;Compress=True;");
            dbConnection.Execute(@"
                create table if not exists events (
                Id integer primary key autoincrement,
                Message text)");
        }

        public Task AsWebClient()
        {
            return Groups.Add(Context.ConnectionId, "webclients");
        }

        public Task AsBusClient()
        {
            return Groups.Add(Context.ConnectionId, "busclients");
        }

        public void ReceiveFromBus(string message)
        {
            dbConnection.Execute("insert into events (Message) values (@Message)", new {Message = message});
            Clients.Group("webclients").notify(message);
        }

        public void SendToBus(string message)
        {
            Clients.All.addEndpoint(message);
        }

        protected override void Dispose(bool disposing)
        {
            dbConnection.Dispose();
        }
    }
}
namespace Rebus.FleetKeeper
{
    internal class Program
    {
        static void Main(string[] args)
        {
            var server = new FleetKeeperServer();
            server.Start();
        }
    }

    // Send message to client
    // Receive request from client and response with some html
    // Receive request from client and issue a command against the bus
}
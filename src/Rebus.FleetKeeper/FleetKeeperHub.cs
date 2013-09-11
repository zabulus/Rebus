using Microsoft.AspNet.SignalR;

namespace Rebus.FleetKeeper
{
    public class FleetKeeperHub : Hub
    {
        public void Receive(string message)
        {

        }

        public void Reply(string message)
        {
            Clients.All.addEndpoint(message);
        }
    }
}
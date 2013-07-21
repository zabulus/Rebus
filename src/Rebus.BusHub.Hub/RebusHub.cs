using System.Reflection;
using System.Threading.Tasks;
using log4net;

namespace Rebus.BusHub.Hub
{
    public class RebusHub : Microsoft.AspNet.SignalR.Hub
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        public override Task OnConnected()
        {
            Log.InfoFormat("{0} connected", Context.ConnectionId);

            return base.OnConnected();
        }

        public override Task OnDisconnected()
        {
            Log.InfoFormat("{0} disconnected", Context.ConnectionId);

            return base.OnDisconnected();
        }

        public override Task OnReconnected()
        {
            Log.InfoFormat("{0} reconnected", Context.ConnectionId);

            return base.OnReconnected();
        }

        public void MessageToHub(string message)
        {
        }
    }
}
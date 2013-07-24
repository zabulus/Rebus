using System;
using System.Reflection;
using System.Threading.Tasks;
using Newtonsoft.Json;
using log4net;
using System.Linq;

namespace Rebus.BusHub.Hub
{
    public class RebusHub : Microsoft.AspNet.SignalR.Hub
    {
        static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        static readonly JsonSerializerSettings SerializerSettings =
            new JsonSerializerSettings {TypeNameHandling = TypeNameHandling.All};

        static readonly MethodInfo DispatchMethodInfo = typeof(RebusHub).GetMethod("Dispatch", BindingFlags.Instance|BindingFlags.NonPublic);

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

        public void MessageToHub(string str)
        {
            var message = JsonConvert.DeserializeObject(str, SerializerSettings);
            var messageType = message.GetType();

            try
            {
                DispatchMethodInfo.MakeGenericMethod(messageType)
                                  .Invoke(this, new[] {message});
            }
            catch (TargetInvocationException tae)
            {
                throw new ApplicationException(string.Format("An error occurred while dispatching message {0}", message), tae);
            }
        }

        // ReSharper disable UnusedMember.Local
        void Dispatch<TMessage>(TMessage message)
        {
            var relevantMessageHandlers = BusHubService
                .MessageHandlers.OfType<IMessageHandler<TMessage>>()
                .ToList();

            foreach (var handler in relevantMessageHandlers)
            {
                try
                {
                    handler.Handle(message);
                }
                catch (Exception e)
                {
                    throw new ApplicationException(
                        string.Format("An error occurred while dispatching to handler {0}", handler), e);
                }
            }
        }
        // ReSharper restore UnusedMember.Local
    }
}
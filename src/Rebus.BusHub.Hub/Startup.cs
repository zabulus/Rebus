using Microsoft.AspNet.SignalR;
using Owin;

namespace Rebus.BusHub.Hub
{
    class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var config = new HubConfiguration { EnableCrossDomain = true };
            app.MapHubs(config);
        }
    }
}
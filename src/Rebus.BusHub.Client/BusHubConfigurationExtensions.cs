using Rebus.Configuration;

namespace Rebus.BusHub.Client
{
    public static class BusHubConfigurationExtensions
    {
         public static RebusConfigurer ConnectToBusHub(this RebusConfigurer configurer, string busHubUri)
         {
             configurer.AddDecoration(backbone =>
                 {
                     var inputQueueAddress = backbone.ReceiveMessages.InputQueueAddress;
                     var client = new BusHubClient(busHubUri, inputQueueAddress);

                     // WARNING: we rely on the fact that decorators are applied before the events are transferred to the bus
                     configurer.Events(e =>
                         {
                             e.BusDisposed += bus => client.Dispose();
                         });
                 });

             return configurer;
         }
    }
}
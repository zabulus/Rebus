using System;

namespace Rebus.Configuration
{
    /// <summary>
    /// Configurer that allows for modifying a few behavioral aspects of how the bus
    /// </summary>
    public class RebusBehaviorConfigurer
    {
        readonly ConfigurationBackbone backbone;

        internal RebusBehaviorConfigurer(ConfigurationBackbone backbone)
        {
            this.backbone = backbone;
        }

        /// <summary>
        /// Specifies an alternative way of figuring out an error queue address to which poison messages will be sent
        /// </summary>
        public RebusBehaviorConfigurer UseAlternativeErrorQueueAddress(Func<object, string> messageToErrorQueueAddress)
        {
            backbone.AddDecoration(b => b.ErrorTracker.AddErrorQueueAddressResolver(messageToErrorQueueAddress));

            return this;
        }
    }
}
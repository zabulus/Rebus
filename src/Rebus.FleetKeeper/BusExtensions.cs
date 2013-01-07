using System;
using System.Collections.Concurrent;
using System.Net;
using Rebus.Configuration;

namespace Rebus.FleetKeeper
{
    public static class BusExtensions
    {
        public static ConcurrentDictionary<IBus, FleetKeeperClient> clients =
            new ConcurrentDictionary<IBus, FleetKeeperClient>();

        public static RebusConfigurer InstallFleetKeeper(this RebusConfigurer configurer)
        {
            configurer.Events(events => events.BusStarted += bus =>
            {
                var client = new FleetKeeperClient(bus, IPAddress.Loopback, 8001);
                if (!clients.TryAdd(bus, client))
                    throw new InvalidOperationException("Somehow this bus already has a FleetKeeper client attached. " +
                                                        "That should only be possible if you've started the same bus instance on two different threads simultanously. " +
                                                        "Please don't do that.");

                client.Start();
            });

            //TODO: BusStopped => Dispose
            return configurer;
        }
    }
}
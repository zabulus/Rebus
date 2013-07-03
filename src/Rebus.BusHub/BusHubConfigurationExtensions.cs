using System;
using Rebus.Configuration;
using Rebus.Logging;

namespace Rebus.BusHub
{
    public static class BusHubConfigurationExtensions
    {
        const string RebusHubUrlEnvironmentVariableName = "RebusHubUrl";

        static ILog log;

        static BusHubConfigurationExtensions()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        public static void ConnectToBusHub(this RebusConfigurer configurer)
        {
            var rebusHubUri = GetUrlFromEnvironmentVariableOrNull();

            if (string.IsNullOrWhiteSpace(rebusHubUri))
            {
                throw new ConfigurationException("Could not find Rebus Hub endpoint URI");
            }
        }

        static string GetUrlFromEnvironmentVariableOrNull()
        {
            try
            {
                var url = Environment.GetEnvironmentVariable(RebusHubUrlEnvironmentVariableName);

                if (!string.IsNullOrWhiteSpace(url))
                {
                    log.Info("Found Rebus Hub URI configured in environment variable: {0}", url);
                }

                return url;
            }
            catch (Exception e)
            {
                throw new ApplicationException(
                    string.Format("An error occurred while retrieving environment variable '{0}'",
                                  RebusHubUrlEnvironmentVariableName), e);
            }
        }
    }
}

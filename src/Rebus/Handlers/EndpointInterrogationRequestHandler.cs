using System;
using System.Collections.Generic;
using System.Diagnostics;
using Rebus.Bus;
using Rebus.Messages;

namespace Rebus.Handlers
{
    /// <summary>
    /// Internal message handler that returns different pieces of information about the
    /// Rebus endpoint as it's currently running
    /// </summary>
    class EndpointInterrogationRequestHandler : IHandleMessages<EndpointInterrogationRequest>
    {
        readonly ISendReplies sendReplies;
        readonly IInterrogateThisEndpoint interrogateThisEndpoint;

        public EndpointInterrogationRequestHandler(ISendReplies sendReplies, IInterrogateThisEndpoint interrogateThisEndpoint)
        {
            this.sendReplies = sendReplies;
            this.interrogateThisEndpoint = interrogateThisEndpoint;
        }

        public void Handle(EndpointInterrogationRequest message)
        {
            var reply = new EndpointInterrogationReply
                            {
                                Success = true,
                                InterrogationErrors = new List<string>()
                            };

            Try(reply, PopulateProcessInfo, "ProcessInfo");
            Try(reply, PopulateEnvironmentInfo, "EnvironmentInfo");
            Try(reply, PopulateRebusEndpointInfo, "RebusEndpointInfo");

            sendReplies.Reply(reply);
        }

        void PopulateRebusEndpointInfo(EndpointInterrogationReply reply)
        {
            var info =
                new RebusEndpointInfo
                    {
                        InputQueueAddress = interrogateThisEndpoint.InputQueueAddress ?? "",
                        OneWayClientMode = interrogateThisEndpoint.OneWayClientMode,
                        Workers = interrogateThisEndpoint.Workers,
                        AppDomainRebusEndpointId = interrogateThisEndpoint.AppDomainRebusEndpointId,
                        MulticastOptions = interrogateThisEndpoint.IsBrokered
                                               ? MulticastOptions.Centralized
                                               : MulticastOptions.Distributed,
                    };

            reply.RebusEndpointInfo = info;
        }

        void PopulateEnvironmentInfo(EndpointInterrogationReply reply)
        {
            var info =
                new EnvironmentInfo
                    {
                        CommandLine = Environment.CommandLine,
                        UserDomainName = Environment.UserDomainName,
                        MachineName = Environment.MachineName,
                        UserName = Environment.UserName,
                        OSVersion = Environment.OSVersion.ToString(),
                        Is64BitOperatingSystem = Environment.Is64BitOperatingSystem,
                        Is64BitProcess = Environment.Is64BitProcess,
                        WorkingSet = Environment.WorkingSet,
                    };

            reply.EnvironmentInfo = info;
        }

        void PopulateProcessInfo(EndpointInterrogationReply reply)
        {
            var process = Process.GetCurrentProcess();

            var info =
                new ProcessInfo
                    {
                        Id = process.Id,
                        ProcessName = process.ProcessName,
                        StartTime = process.StartTime,
                    };

            reply.ProcessInfo = info;
        }

        void Try(EndpointInterrogationReply reply, Action<EndpointInterrogationReply> action, string fieldToPopulate)
        {
            try
            {
                action(reply);
            }
            catch (Exception e)
            {
                reply.Success = false;
                reply.InterrogationErrors.Add(string.Format("An error occurred while populating {0}: {1}",
                                                      fieldToPopulate, e));
            }

        }
    }
}
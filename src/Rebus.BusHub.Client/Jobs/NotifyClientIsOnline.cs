using System;
using System.Diagnostics;
using System.Reflection;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client.Jobs
{
    public class NotifyClientIsOnline : Job
    {
        public override void Initialize(IRebusEvents events, IBusHubClient client)
        {
            var entryAssembly = Assembly.GetEntryAssembly();

            string executablePath;
            string codebasePath;
            string entryPointAssemblyVersion;
            
            if (entryAssembly != null)
            {
                executablePath = entryAssembly.Location;
                codebasePath = entryAssembly.CodeBase;
                entryPointAssemblyVersion = entryAssembly.GetName().Version.ToString();
            }
            else
            {
                executablePath = "n/a";
                codebasePath = "n/a";
                entryPointAssemblyVersion = "n/a";
            }

            var currentProcess = Process.GetCurrentProcess();
            var processStartInfo = currentProcess.StartInfo;
            var fileName = !string.IsNullOrWhiteSpace(processStartInfo.FileName)
                               ? processStartInfo.FileName
                               : currentProcess.ProcessName;

            var arguments = processStartInfo.Arguments;

            SendMessage(new ClientIsOnline(client.InputQueueAddress,
                                           executablePath,
                                           codebasePath,
                                           Environment.MachineName,
                                           Environment.OSVersion.ToString(),
                                           entryPointAssemblyVersion,
                                           fileName,
                                           arguments));
        }
    }
}
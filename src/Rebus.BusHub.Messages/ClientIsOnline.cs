namespace Rebus.BusHub.Messages
{
    public class ClientIsOnline : BusHubMessage
    {
        public ClientIsOnline(string inputQueueAddress, string executablePath, string machineName, string os, string entryPointAssemblyVersion)
        {
            InputQueueAddress = inputQueueAddress;
            ExecutablePath = executablePath;
            MachineName = machineName;
            Os = os;
            EntryPointAssemblyVersion = entryPointAssemblyVersion;
        }

        public string InputQueueAddress { get; set; }
        public string ExecutablePath { get; set; }
        public string MachineName { get; set; }
        public string Os { get; set; }
        public string EntryPointAssemblyVersion { get; set; }
    }
}
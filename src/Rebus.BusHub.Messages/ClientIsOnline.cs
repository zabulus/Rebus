namespace Rebus.BusHub.Messages
{
    public class ClientIsOnline : BusHubMessage
    {
        public ClientIsOnline(
            string inputQueueAddress, 
            string executablePath, 
            string codebasePath, 
            string machineName, 
            string os, 
            string entryPointAssemblyVersion,
            string fileName,
            string arguments)
        {
            InputQueueAddress = inputQueueAddress;
            ExecutablePath = executablePath;
            CodebasePath = codebasePath;
            MachineName = machineName;
            Os = os;
            EntryPointAssemblyVersion = entryPointAssemblyVersion;
            FileName = fileName;
            Arguments = arguments;
        }

        public string InputQueueAddress { get; set; }
        public string ExecutablePath { get; set; }
        public string CodebasePath { get; set; }
        public string MachineName { get; set; }
        public string Os { get; set; }
        public string EntryPointAssemblyVersion { get; set; }
        public string FileName { get; set; }
        public string Arguments { get; set; }
    }
}
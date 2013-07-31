namespace Rebus.BusHub.Messages
{
    public class ClientIsOnline : BusHubMessage
    {
        public ClientIsOnline(
            string inputQueueAddress, 
            string machineName, 
            string os, 
            string fileName,
            string arguments,
            LoadedAssembly[] loadedAssemblies)
        {
            InputQueueAddress = inputQueueAddress;
            MachineName = machineName;
            Os = os;
            FileName = fileName;
            Arguments = arguments;
            LoadedAssemblies = loadedAssemblies;
        }

        public string InputQueueAddress { get; set; }
        public string MachineName { get; set; }
        public string Os { get; set; }
        public string FileName { get; set; }
        public string Arguments { get; set; }
        public LoadedAssembly[] LoadedAssemblies { get; set; }
    }

    public class LoadedAssembly
    {
        public string Name { get; set; }
        public string Version { get; set; }
        public string Location { get; set; }
        public string Codebase { get; set; }
        public bool IsEntryAssembly { get; set; }
    }
}
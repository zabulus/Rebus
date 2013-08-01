namespace Rebus.BusHub.Messages.Causal
{
    /// <summary>
    /// Raised when the bus is started. Collects a bunch of information about the current process so that we know what's running.
    /// </summary>
    public class BusHasBeenStarted : BusHubMessage
    {
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
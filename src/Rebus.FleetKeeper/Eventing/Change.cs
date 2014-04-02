namespace Rebus.FleetKeeper.Old
{
    public class Change
    {
        public string Op 
        {
            get { return GetType().Name.ToLowerInvariant(); }
        }

        public string Path { get; set; }
        public long Version { get; set; }
    }
}
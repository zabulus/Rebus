namespace Rebus.BusHub.Messages
{
    public class ClientIsOnline : BusHubMessage
    {
        public ClientIsOnline(string inputQueueAddress)
        {
            InputQueueAddress = inputQueueAddress;
        }

        public string InputQueueAddress { get; set; }
    }
}
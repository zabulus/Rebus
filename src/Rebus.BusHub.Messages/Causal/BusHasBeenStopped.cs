namespace Rebus.BusHub.Messages.Causal
{
    /// <summary>
    /// Raised when the bus is stopped. This bad boy terminates the event stream for one particular client instance.
    /// </summary>
    public class BusHasBeenStopped : BusHubMessage
    {
    }
}
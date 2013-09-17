namespace Rebus
{
    public interface IRebusDiagnostics
    {
        IReceiveMessages ReceiveMessagesQueue { get; }
    }
}
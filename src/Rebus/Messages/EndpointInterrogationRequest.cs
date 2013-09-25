using System;

namespace Rebus.Messages
{
    /// <summary>
    /// Request that can be sent to an endpoint in order to interrogate it
    /// </summary>
    [Serializable]
    public class EndpointInterrogationRequest : IRebusControlMessage
    {
    }
}
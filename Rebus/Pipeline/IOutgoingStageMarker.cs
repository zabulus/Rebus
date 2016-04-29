using System;
using System.Threading.Tasks;

namespace Rebus.Pipeline
{
    /// <summary>
    /// Marks a step as a "stage marker", which means that other steps can be positioned relative to it
    /// </summary>
    public interface IOutgoingStageMarker : IOutgoingStep
    {
    }

    /// <summary>
    /// Marks a step as a "stage marker", which means that other steps can be positioned relative to it
    /// </summary>
    public interface IIncomingStageMarker : IIncomingStep
    {
    }

    /// <summary>
    /// Stage marker that marks the front of a pipeline
    /// </summary>
    [StepDocumentation("Marks the front of the pipeline")]
    public class FrontStageMarker : StageMarker, IIncomingStageMarker, IOutgoingStageMarker { }

    /// <summary>
    /// Stage marker that marks a good place to implement serialization/deserialization
    /// </summary>
    [StepDocumentation("Marks the stage where messages are serialized/deserialized")]
    public class SerializationStageMarker : StageMarker, IIncomingStageMarker, IOutgoingStageMarker { }

    /// <summary>
    /// Stage marker that marks a good place to assign message headers
    /// </summary>
    [StepDocumentation("Marks the stage where headers are assigned")]
    public class AssignHeadersStageMarker : StageMarker, IOutgoingStageMarker { }

    /// <summary>
    /// Stage marker that marks a good place to send an outgoing message
    /// </summary>
    [StepDocumentation("Marks the stage where messages are actually sent")]
    public class SendMessageStageMarker : StageMarker, IOutgoingStageMarker { }

    /// <summary>
    /// Stage marker that marks the back of a pipeline
    /// </summary>
    [StepDocumentation("Marks the back of the pipeline")]
    public class BackStageMarker : StageMarker, IIncomingStageMarker, IOutgoingStageMarker { }

    /// <summary>
    /// Stage marker that marks a good place to track messages, e.g. for tracking delivery attempts
    /// </summary>
    [StepDocumentation("Marks the stage where retry tracking can be implemented")]
    public class RetryStageMarker : StageMarker, IIncomingStageMarker { }

    /// <summary>
    /// Stage marker that marks a good place to prepare things that need to be set up before actually handling a message
    /// </summary>
    [StepDocumentation("Marks the stage where handlers are prepared")]
    public class HandlerInstantiationStageMarker : StageMarker, IIncomingStageMarker { }

    /// <summary>
    /// Stage marker that marks a good place to actually dispatch a message
    /// </summary>
    [StepDocumentation("Marks the stage where is message is dispatched to handlers")]
    public class DispatchStageMarker : StageMarker, IIncomingStageMarker { }

    /// <summary>
    /// Abstract step implementation that can function as a stage marker. Should be removed from the pipeline before
    /// the bus actually starts, but the stage marker does not change the behavior in any way
    /// </summary>
    public abstract class StageMarker : IIncomingStep, IOutgoingStep
    {
        /// <summary>
        /// Just delegates message processing to the rest of the pipeline
        /// </summary>
        public Task Process(IncomingStepContext context, Func<Task> next)
        {
            return next();
        }

        /// <summary>
        /// Just delegates message processing to the rest of the pipeline
        /// </summary>
        public Task Process(OutgoingStepContext context, Func<Task> next)
        {
            return next();
        }
    }
}
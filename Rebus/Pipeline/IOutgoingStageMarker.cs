using System;
using System.Threading.Tasks;

namespace Rebus.Pipeline
{
    public interface IOutgoingStageMarker : IOutgoingStep
    {
    }

    public interface IIncomingStageMarker : IIncomingStep
    {
    }

    [StepDocumentation("Marks the front of the pipeline")]
    public class FrontStageMarker : StageMarker, IIncomingStageMarker, IOutgoingStageMarker { }

    [StepDocumentation("Marks the stage where messages are serialized/deserialized")]
    public class SerializationStageMarker : StageMarker, IIncomingStageMarker, IOutgoingStageMarker { }

    [StepDocumentation("Marks the stage where headers are assigned")]
    public class AssignHeadersStageMarker : StageMarker, IOutgoingStageMarker { }

    [StepDocumentation("Marks the stage where messages are actually sent")]
    public class SendMessageStageMarker : StageMarker, IOutgoingStageMarker { }

    [StepDocumentation("Marks the back of the pipeline")]
    public class BackStageMarker : StageMarker, IIncomingStageMarker, IOutgoingStageMarker { }

    [StepDocumentation("Marks the stage where retry tracking can be implemented")]
    public class RetryStageMarker : StageMarker, IIncomingStageMarker { }

    [StepDocumentation("Marks the stage where handlers are prepared")]
    public class HandlerInstantiationStageMarker : StageMarker, IIncomingStageMarker { }

    [StepDocumentation("Marks the stage where is message is dispatched to handlers")]
    public class DispatchStageMarker : StageMarker, IIncomingStageMarker { }

    public class StageMarker : IIncomingStep, IOutgoingStep
    {
        public Task Process(IncomingStepContext context, Func<Task> next)
        {
            return next();
        }

        public Task Process(OutgoingStepContext context, Func<Task> next)
        {
            return next();
        }
    }
}
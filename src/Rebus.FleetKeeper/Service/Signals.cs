using System;
using System.Runtime.InteropServices;

namespace Rebus.FleetKeeper.Service
{
    /// <summary>
    /// Static class (that must remain static) that allows for subscribing to process-level events
    /// (class must remain static for the .NET <see cref="HandlerRoutine"/> to not be collected
    /// prematurely)
    /// </summary>
    public static class Signals
    {
        static Signals()
        {
            SetConsoleCtrlHandler(type =>
                {
                    switch (type)
                    {
                        case CtrlTypes.CtrlCEvent:
                            CtrlCPressed();
                            break;
                        case CtrlTypes.CtrlBreakEvent:
                            CtrlBreakPressed();
                            break;
                        case CtrlTypes.CtrlCloseEvent:
                            ApplicationClosed();
                            break;
                        case CtrlTypes.CtrlLogoffEvent:
                            LoggedOff();
                            break;
                        case CtrlTypes.CtrlShutdownEvent:
                            ShutDown();
                            break;
                        default:
                            throw new ArgumentOutOfRangeException(string.Format("Unknown signal: {0}", type));
                    }
                    return false;
                }, true);
        }

        public static event Action CtrlCPressed = delegate { };

        public static event Action CtrlBreakPressed = delegate { };

        public static event Action ApplicationClosed = delegate { };

        public static event Action LoggedOff = delegate { };

        public static event Action ShutDown = delegate { };

        [DllImport("Kernel32")]
        static extern bool SetConsoleCtrlHandler(HandlerRoutine handler, bool add);

        delegate bool HandlerRoutine(CtrlTypes ctrlType);

        enum CtrlTypes
        {
            CtrlCEvent = 0,
            CtrlBreakEvent = 1,
            CtrlCloseEvent = 2,
            CtrlLogoffEvent = 5,
            CtrlShutdownEvent = 6
        }
    }
}
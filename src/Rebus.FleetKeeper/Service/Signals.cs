using System;
using System.Runtime.InteropServices;

namespace Rebus.FleetKeeper.Service
{
    public class Signals
    {
        public Signals()
        {
            SetConsoleCtrlHandler(type =>
                {
                    switch (type)
                    {
                        case CtrlTypes.CTRL_C_EVENT:
                            CtrlCPressed();
                            break;
                        case CtrlTypes.CTRL_BREAK_EVENT:
                            CtrlBreakPressed();
                            break;
                        case CtrlTypes.CTRL_CLOSE_EVENT:
                            ApplicationClosed();
                            break;
                        case CtrlTypes.CTRL_LOGOFF_EVENT:
                            LoggedOff();
                            break;
                        case CtrlTypes.CTRL_SHUTDOWN_EVENT:
                            ShutDown();
                            break;
                        default:
                            throw new ArgumentOutOfRangeException(string.Format("Unknown signal: {0}", type));
                    }
                    return false;
                }, true);
        }

        // Declare the SetConsoleCtrlHandler function
        // as external and receiving a delegate.
        [DllImport("Kernel32")]
        public static extern bool SetConsoleCtrlHandler(HandlerRoutine handler, bool add);

        // A delegate type to be used as the handler routine 
        // for SetConsoleCtrlHandler.
        public delegate bool HandlerRoutine(CtrlTypes ctrlType);

        // An enumerated type for the control messages
        // sent to the handler routine.
        public enum CtrlTypes
        {
            CTRL_C_EVENT = 0,
            CTRL_BREAK_EVENT,
            CTRL_CLOSE_EVENT,
            CTRL_LOGOFF_EVENT = 5,
            CTRL_SHUTDOWN_EVENT
        }

        public event Action CtrlCPressed = delegate { };

        public event Action CtrlBreakPressed = delegate { };

        public event Action ApplicationClosed = delegate { };

        public event Action LoggedOff = delegate { };

        public event Action ShutDown = delegate { };
    }
}
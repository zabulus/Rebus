using System;
using System.Timers;
using Rebus.BusHub.Messages;

namespace Rebus.BusHub.Client.Jobs
{
    public class SendHeartbeat : Job, IDisposable
    {
        readonly Timer timer = new Timer();

        public SendHeartbeat()
        {
            timer.Elapsed += delegate { Tick(); };
            timer.Interval = TimeSpan.FromSeconds(3).TotalMilliseconds;
        }

        public override void Initialize(IRebusEvents events, IBusHubClient client)
        {
            timer.Start();
        }

        public void Dispose()
        {
            timer.Dispose();
        }

        void Tick()
        {
            SendMessage(new Heartbeat());
        }
    }
}
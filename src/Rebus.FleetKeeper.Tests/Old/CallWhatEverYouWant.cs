using System.Collections.Generic;
using System.Dynamic;
using System.Linq;

namespace Rebus.FleetKeeper.Tests
{
    public class CallWhatEverYouWant : DynamicObject
    {
        public CallWhatEverYouWant()
        {
            Calls = new Dictionary<string, Call>();
        }

        public Dictionary<string, Call> Calls { get; set; }

        public override bool TryInvokeMember(InvokeMemberBinder binder, object[] args, out object result)
        {
            Calls.Add(binder.Name, new Call {Arguments = args.ToList()});

            result = null;
            return true;
        }

        public class Call
        {
            public List<object> Arguments { get; set; }
        }
    }
}
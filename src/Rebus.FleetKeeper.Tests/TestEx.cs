using Newtonsoft.Json.Linq;

namespace Rebus.FleetKeeper.Tests
{
    public static class TestEx
    {
        public static JObject ToJObject(this object receiver)
        {
            return JObject.FromObject(receiver);
        }

        public static string ToJson(this object receiver)
        {
            return JObject.FromObject(receiver).ToString();
        }
    }
}
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Rebus.FleetKeeper.Old;

namespace Rebus.FleetKeeper.Eventing
{
    public abstract class ReadModel
    {
        readonly JsonSerializer serializer;

        protected ReadModel()
        {
            serializer = new JsonSerializer
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            };

            Changes = new List<Change>();
        }

        [JsonIgnore]
        public List<Change> Changes { get; protected set; }

    }
}
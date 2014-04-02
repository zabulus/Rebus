using System;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using NUnit.Framework;
using Rebus.FleetKeeper.Eventing;
using Rebus.FleetKeeper.Old;
using Shouldly;

namespace Rebus.FleetKeeper.Tests
{
    public abstract class ReadModelTestBase<T> where T : ReadModel, new()
    {
        readonly JsonSerializer serializer;
        protected T model;

        protected ReadModelTestBase()
        {
            serializer = new JsonSerializer
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            };
        }

        [SetUp]
        public void Setup()
        {
            model = new T();
        }

        [TearDown]
        public void Teardown()
        {
            AssertChangesAppliedToFreshModelEquals(model);
        }

        protected void AssertChangesAppliedToFreshModelEquals(T changedModel)
        {
            var freshModel = JObject.FromObject(new T(), serializer);
            Patch(freshModel, changedModel.Changes.ToArray());

            var expected = JObject.FromObject(changedModel, serializer);

            JToken.DeepEquals(freshModel, expected).ShouldBe(true);
        }

        protected void Patch(JObject state, params Change[] changes)
        {
            foreach (var change in changes)
            {
                var add = change as Add;
                if (add != null)
                {
                    var jArray = Dereference<JArray>(state, add.Path);
                    jArray.Add(JObject.FromObject(add.Value, serializer));
                    break;
                }
 
                var replace = change as Replace;
                if (replace != null)
                {
                    var jProperty = Dereference<JProperty>(state, replace.Path);
                    jProperty.Value = JToken.FromObject(replace.Value, serializer);
                    break;
                }
            }
        }

        TToken Dereference<TToken>(JToken json, string path) where TToken : JToken
        {
            var result = json;
            foreach (var part in path.Split('/').Where(s => !string.IsNullOrWhiteSpace(s)))
            {
                JToken next;
                if (part == "-")
                {
                    next = result;
                }
                else
                {
                    next = result[part];
                }

                if (next == null)
                {
                    throw new InvalidOperationException("Could not find '" + part + "' on " + result);
                }

                result = next;
            }

            return (TToken)result;
        }

    }
}
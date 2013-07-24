using System;
using MongoDB.Driver;

namespace Rebus.BusHub.Hub.Handlers
{
    public class SaveToMongo : IMessageHandler<object>
    {
        readonly MongoDatabase database;

        public SaveToMongo()
        {
            database = new MongoClient("mongodb://localhost").GetServer().GetDatabase("bushub");
        }

        public void Handle(object message)
        {
            database.GetCollection("events")
                    .Insert(new ReceivedEvent
                                {
                                    HubTimeUtc = DateTime.UtcNow,
                                    Event = message
                                },
                            WriteConcern.Unacknowledged);
        }
    }

    public class ReceivedEvent
    {
        public DateTime HubTimeUtc { get; set; }
        public object Event { get; set; }
    }
}
using System;
using System.Linq;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using Rebus.Configuration;
using Rebus.Extensions;
using Rebus.Logging;

namespace Rebus.Bus
{
    /// <summary>
    /// Implements logic to track failed message deliveries and decide when to consider messages poisonous.
    /// </summary>
    public class ErrorTracker : IErrorTracker, IDisposable
    {
        static ILog log;

        static ErrorTracker()
        {
            RebusLoggerFactory.Changed += f => log = f.GetCurrentClassLogger();
        }

        readonly ConcurrentDictionary<string, TrackedMessage> trackedMessages = new ConcurrentDictionary<string, TrackedMessage>();
        readonly List<Func<object, string>> errorQueueAddressResolvers = new List<Func<object, string>>();
        readonly string defaultErrorQueueAddress;

        TimeSpan timeoutSpan;
        Timer timer;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="timeoutSpan">How long messages will be supervised by the ErrorTracker</param>
        /// <param name="timeoutCheckInterval">This is the interval that will last between checking whether delivery attempts have been tracked for too long</param>
        /// <param name="defaultErrorQueueAddress">This is the address of the error queue to which messages should be forwarded whenever they are deemed poisonous</param>
        public ErrorTracker(TimeSpan timeoutSpan, TimeSpan timeoutCheckInterval, string defaultErrorQueueAddress)
        {
            this.defaultErrorQueueAddress = defaultErrorQueueAddress;
            
            StartTimeoutTracker(timeoutSpan, timeoutCheckInterval);

            var maxRetriesFromConfig = RebusConfigurationSection
                .GetConfigurationValueOrDefault(s => s.MaxRetries, 5)
                .GetValueOrDefault(5);

            SetMaxRetries(maxRetriesFromConfig);
        }

        /// <summary>
        /// Default constructor which sets the timeoutSpan to 1 day
        /// </summary>
        public ErrorTracker(string errorQueueAddress)
            : this(TimeSpan.FromDays(1), TimeSpan.FromMinutes(5), errorQueueAddress)
        {
        }

        /// <summary>
        /// Sets the maximum number of attempts that should be made when delivering a message that fails
        /// </summary>
        public void SetMaxRetries(int maxRetries)
        {
            if (maxRetries < 0)
            {
                throw new ArgumentException(string.Format("Cannot set max retries to {0} - must be non-negative", maxRetries));
            }

            MaxRetries = maxRetries;
        }

        void StartTimeoutTracker(TimeSpan timeoutSpanToUse, TimeSpan timeoutCheckInterval)
        {
            timeoutSpan = timeoutSpanToUse;
            timer = new Timer(TimeoutTracker, null, TimeSpan.Zero, timeoutCheckInterval);
        }

        void TimeoutTracker(object state)
        {
            CheckForMessageTimeout();
        }

        internal void CheckForMessageTimeout()
        {
            var keysOfExpiredMessages = trackedMessages
                .Where(m => m.Value.Expired(timeoutSpan))
                .Select(m => m.Key)
                .ToList();
            
            keysOfExpiredMessages.ForEach(key =>
                {
                    TrackedMessage temp;
                    if (trackedMessages.TryRemove(key, out temp))
                    {
                        log.Warn(
                            "Timeout expired for delivery tracking of message with ID {0}. This probably means that the " +
                            "message was deleted from the queue before the max number of retries could be carried out, " +
                            "thus the delivery tracking for this message could not be fully completed. The error text for" +
                            "the message deliveries is as follows: {1}", temp.Id, temp.GetErrorMessages());
                    }
                });
        }

        /// <summary>
        /// Increments the fail count for this particular message, and starts tracking
        /// the message if it is not already being tracked.
        /// </summary>
        /// <param name="id">ID of the message to track</param>
        /// <param name="exception">The exception that was caught, thus resulting in wanting to track this message</param>
        public void TrackDeliveryFail(string id, Exception exception)
        {
            var trackedMessage = GetOrAdd(id);
            trackedMessage.AddError(exception);
        }

        /// <summary>
        /// Gets the globally addressable address of the error queue
        /// </summary>
        public string DefaultErrorQueueAddress
        {
            get { return defaultErrorQueueAddress; }
        }

        /// <summary>
        /// Stops tracking the message with the specified ID. If the message is not
        /// being tracked, nothing happens.
        /// </summary>
        /// <param name="id">ID of message to stop tracking</param>
        public void StopTracking(string id)
        {
            TrackedMessage temp;
            trackedMessages.TryRemove(id, out temp);
        }

        /// <summary>
        /// Gets the error messages tracked so far for the message with the specified ID.
        /// </summary>
        /// <param name="id">ID of message whose error messages to get</param>
        /// <returns>Concatenated string of the tracked error messages</returns>
        public string GetErrorText(string id)
        {
            var trackedMessage = GetOrAdd(id);
            
            return trackedMessage.GetErrorMessages();
        }

        /// <summary>
        /// Gets the error queue address to use for the specified message that has failed too many times. The default
        /// error queue address will be used in case null is returned.
        /// </summary>
        public string GetErrorQueueAddress(object failedMessage)
        {
            foreach (var resolver in errorQueueAddressResolvers)
            {
                var address = resolver(failedMessage);

                if (address == null) continue;
                
                return address;
            }

            return DefaultErrorQueueAddress;
        }

        /// <summary>
        /// Retrieves information about caught exceptions for the message with the
        /// given id.
        /// </summary>
        /// <param name="id">ID of message whose poison message information to get</param>
        /// <returns>Information about the poison message</returns>
        public PoisonMessageInfo GetPoisonMessageInfo(string id)
        {
            var trackedMessage = GetOrAdd(id);

            return trackedMessage.GetPoisonMessageInfo();
        }

        /// <summary>
        /// Adds an additional error queue address resolver that will be asked for an error queue address when a message fails.
        /// If null is returned, the default error queue address is used.
        /// </summary>
        public void AddErrorQueueAddressResolver(Func<object, string> messageToErrorQueueAddress)
        {
            errorQueueAddressResolvers.Add(messageToErrorQueueAddress);
        }

        /// <summary>
        /// Determines whether the message with the specified ID has failed
        /// "enough time"
        /// </summary>
        /// <param name="id">ID of message to check</param>
        /// <returns>Whether the message has failed too many times</returns>
        public bool MessageHasFailedMaximumNumberOfTimes(string id)
        {
            var trackedMessage = GetOrAdd(id);
            return trackedMessage.FailCount >= MaxRetries;
        }

        /// <summary>
        /// Indicates how many times a message will be retried before it is moved to the error queue
        /// </summary>
        public int MaxRetries { get; private set; }

        TrackedMessage GetOrAdd(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                throw new ArgumentException(string.Format("Id of message to track is null! Cannot track message errors with a null id"));
            }

            return trackedMessages.GetOrAdd(id, i => new TrackedMessage(id));
        }

        class TrackedMessage
        {
            readonly Queue<Timed<Exception>> exceptions = new Queue<Timed<Exception>>();
            int errorCount;

            public TrackedMessage(string id)
            {
                Id = id;
                TimeAdded = RebusTimeMachine.Now();
            }

            public string Id { get; private set; }
            
            public DateTime TimeAdded { get; private set; }

            public int FailCount
            {
                get { return errorCount; }
            }

            public void AddError(Exception exception)
            {
                errorCount++;
                exceptions.Enqueue(exception.Now());

                log.Debug("Message {0} has failed {1} time(s)", Id, FailCount);

                if (exceptions.Count > 10)
                {
                    while (exceptions.Count > 10) exceptions.Dequeue();
                }
            }

            public string GetErrorMessages()
            {
                return string.Join(Environment.NewLine + Environment.NewLine, exceptions.Select(FormatTimedException));
            }

            public PoisonMessageInfo GetPoisonMessageInfo()
            {
                return new PoisonMessageInfo(Id, exceptions.Select(e => new Timed<Exception>(e.Time, e.Value)));
            }

            static string FormatTimedException(Timed<Exception> e)
            {
                return string.Format(@"{0}:
{1}", e.Time, e.Value);
            }

            public bool Expired(TimeSpan timeout)
            {
                return TimeAdded.ElapsedUntilNow() >= timeout;
            }
        }

        /// <summary>
        /// Disposes the error tracker
        /// </summary>
        public void Dispose()
        {
            timer.Dispose();
        }
    }
}
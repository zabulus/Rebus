using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace Rebus.Extensions
{
    /// <summary>
    /// Nifty extensions for <see cref="IEnumerable{T}"/>
    /// </summary>
    public static class EnumerableExtensions
    {
        /// <summary>
        /// Returns the items of the sequence in a new <see cref="HashSet{T}"/> 
        /// </summary>
        public static HashSet<T> ToHashSet<T>(this IEnumerable<T> items)
        {
            return new HashSet<T>(items);
        }

        /// <summary>
        /// Returns the items of the sequence in a new <see cref="HashSet{T}"/>, checking equality with the given <paramref name="equalityComparer"/>
        /// </summary>
        public static HashSet<T> ToHashSet<T>(this IEnumerable<T> items, IEqualityComparer<T> equalityComparer)
        {
            return new HashSet<T>(items, equalityComparer);
        }

        /// <summary>
        /// Iterates the sequence, calling the given <paramref name="itemAction"/> for each item
        /// </summary>
        public static void ForEach<T>(this IEnumerable<T> items, Action<T> itemAction)
        {
            foreach (var item in items)
            {
                itemAction(item);
            }
        }

        /// <summary>
        /// Empties the queue and returns the dequeued items in a list.
        /// </summary>
        public static List<TItem> EmptyIntoList<TItem>(this ConcurrentQueue<TItem> queue)
        {
            var list = new List<TItem>();
            TItem item;

            while (queue.TryDequeue(out item))
            {
                list.Add(item);
            }

            return list;
        }
    }
}
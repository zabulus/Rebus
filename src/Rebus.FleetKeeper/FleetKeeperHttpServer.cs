using System;
using System.Net;
using System.Reactive.Linq;

namespace Rebus.FleetKeeper
{
    internal class FleetKeeperHttpServer : IDisposable
    {
        readonly IObservable<Diagnostics> diagnostics;
        IDisposable subscription;

        public FleetKeeperHttpServer(IObservable<Diagnostics> diagnostics)
        {
            this.diagnostics = diagnostics;
        }

        public void Start()
        {
            var listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:8080/");
            listener.Start();

            subscription = Observable.FromAsync(listener.GetContextAsync)
                                     .Repeat()
                                     .Retry()
                                     .Publish()
                                     .RefCount()
                                     .Subscribe(context =>
                                     {
                                         Console.WriteLine(context.Request.RawUrl);

                                         switch (context.Request.RawUrl)
                                         {
                                             case "/stream":
                                                 break;
                                             default:
                                                 var found = File(context, "..\\..\\Client" + context.Request.RawUrl)
                                                             || File(context, "..\\..\\Client\\index.html");
                                                 
                                                 if(!found)
                                                     throw new Exception();
                                                    
                                                 break;
                                         }
                                     });
        }

        static bool File(HttpListenerContext context, string filename)
        {
            if (!System.IO.File.Exists(filename))
                return false;

            var bytes = System.IO.File.ReadAllBytes(filename);
            var hasBOM = bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF;
            var skip = (hasBOM) ? 3 : 0;
            context.Response.OutputStream.Write(bytes, skip, bytes.Length - skip);
            context.Response.Close();
            return true;
        }

        public void Dispose()
        {
            subscription.Dispose();
        }
    }
}
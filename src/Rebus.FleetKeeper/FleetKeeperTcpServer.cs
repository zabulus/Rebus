using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reactive.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Rebus.FleetKeeper
{
    internal class FleetKeeperTcpServer
    {
        // Listen to incoming data from the bus
        // Send a command to the bus about doing something (if it's going to be http)
        
        public void Start()
        {
            var listener = new TcpListener(IPAddress.Any, 8001);
            listener.Start();
            Observable.FromAsync(listener.AcceptTcpClientAsync).Subscribe(client =>
                      {
                          Console.WriteLine("Connected");

                          var stream = client.GetStream();
                          int result;
                          while ((result = stream.ReadByte()) > 0)
                          {
                              Console.WriteLine(Encoding.ASCII.GetString(new[] {(byte)result}));
                          }
                      }, () => Console.WriteLine("Final"));


            //var server = from client in Observable.FromAsync(listener.AcceptTcpClientAsync)
            //             let stream = client.GetStream()
            //             from message in stream.Read()
                      //       
        }

        //public static IObservable<byte[]> WhenDataReceived(NetworkStream stream, int byteCount, SocketFlags flags = SocketFlags.None)
        //{
        //    return Observable.Create<byte[]>(
        //        observer =>
        //        {


        //            var whenDataReceived = Observable.FromAsyncPattern<byte[], int, int, SocketFlags, int>(
        //                socket.BeginReceive,
        //                socket.EndReceive);

        //            byte[] buffer = new byte[byteCount];
        //            int remainder = byteCount;
        //            bool shutdown = false;

        //            Observable.FromAsync(() => stream.ReadAsync(buffer, ))

        //            return Observable.While(() => remainder > 0 && !shutdown,
        //                Observable.Defer(() =>
        //                    whenDataReceived(buffer, buffer.Length - remainder, remainder, flags)
        //                    .Do(read =>
        //                    {
        //                        remainder -= read;

        //                        if (read == 0)
        //                            shutdown = true;
        //                    })))
        //                //.Prune(whenCompleted => whenCompleted.Select(_ => buffer))
        //                .Subscribe(
        //                    observer.OnNext,
        //                    ex =>
        //                    {
        //                        var socketError = ex as SocketException;

        //                        if (socketError != null &&
        //                                (socketError.SocketErrorCode == SocketError.Shutdown
        //                            || socketError.SocketErrorCode == SocketError.Disconnecting))
        //                        {
        //                            observer.OnCompleted();
        //                        }
        //                        else
        //                            observer.OnError(ex);
        //                    },
        //                    observer.OnCompleted);
        //        });
        //}
    }


}
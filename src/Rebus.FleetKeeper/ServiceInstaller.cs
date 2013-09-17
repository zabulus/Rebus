using System;
using System.Collections;
using System.ComponentModel;
using System.Configuration.Install;
using System.ServiceProcess;

namespace Energy10.BeCalculator
{
    [RunInstaller(true)]
    public sealed class ServiceInstaller : System.ServiceProcess.ServiceInstaller
    {
        public ServiceInstaller()
        {
            Description = "Energy10 BeCalculator";
            DisplayName = "Energy10 BeCalculator";
            ServiceName = "BeCalculator";
            StartType = ServiceStartMode.Automatic;
        }
        
        public static void Install(string[] args)
        {
            Install(false, args);
        }

        public static void Uninstall(string[] args)
        {
            Install(true, args);
        }

        static void Install(bool undo, string[] args)
        {
            try
            {
                Console.WriteLine(undo ? "uninstalling" : "installing");
                using (var inst = new AssemblyInstaller(typeof (Service).Assembly, args))
                {
                    IDictionary state = new Hashtable();
                    inst.UseNewContext = true;
                    try
                    {
                        if (undo)
                        {
                            inst.Uninstall(state);
                        }
                        else
                        {
                            inst.Install(state);
                            inst.Commit(state);
                        }
                    }
                    catch
                    {
                        try
                        {
                            inst.Rollback(state);
                        }
                        catch {}
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.Message);
            }
        }
    }
}
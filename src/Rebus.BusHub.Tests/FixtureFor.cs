using System;
using System.IO;
using NUnit.Framework;
using log4net.Config;

namespace Rebus.BusHub.Tests
{
    public abstract class FixtureFor<TSut>
    {
        static FixtureFor()
        {
            XmlConfigurator.ConfigureAndWatch(new FileInfo(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log4net.config")));
        }

        protected TSut instance;

        [SetUp]
        public void SetUp()
        {
            instance = SetUpInstance();
        }

        [TearDown]
        public void TearDown()
        {
            TearDownInstance();
        }

        protected abstract TSut SetUpInstance();

        protected virtual void TearDownInstance() { }
    }
}
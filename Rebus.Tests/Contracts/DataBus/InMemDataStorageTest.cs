﻿using NUnit.Framework;
using Rebus.Tests.Contracts.DataBus.Factories;

namespace Rebus.Tests.Contracts.DataBus
{
    [TestFixture]
    public class InMemDataBusStorageTest : GeneralDataBusStorageTests<InMemDataBusStorageFactory> { }

    [TestFixture]
    public class SqlServerDataBusStorageTest : GeneralDataBusStorageTests<SqlServerDataBusStorageFactory> { }
}
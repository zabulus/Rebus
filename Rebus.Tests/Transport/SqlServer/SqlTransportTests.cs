using NUnit.Framework;
using Rebus.Tests.Contracts.Transports;

namespace Rebus.Tests.Transport.SqlServer
{
    [TestFixture, Category(Categories.SqlServer)]
    public class SqlServerTransportBasicSendReceive : BasicSendReceive<SqlTransportFactory> { }

    [TestFixture, Category(Categories.SqlServer)]
    public class SqlServerTransportMessageExpiration : MessageExpiration<SqlTransportFactory> { }

    [TestFixture, Category(Categories.SqlServer)]
    public class RingBufferSqlServerTransportBasicSendReceive : BasicSendReceive<RingBufferSqlTransportFactory> { }

    [TestFixture, Category(Categories.SqlServer)]
    public class RingBufferSqlServerTransportMessageExpiration : MessageExpiration<RingBufferSqlTransportFactory> { }
}
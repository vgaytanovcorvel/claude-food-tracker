using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace MisteryApp.Web.Api.Tests;

[TestClass]
public sealed class SeedTests
{
    [TestMethod]
    public void Seed_ShouldPass_WhenProjectCompiles()
    {
        true.Should().BeTrue();
    }
}

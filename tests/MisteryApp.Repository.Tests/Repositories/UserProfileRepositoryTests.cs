using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Models;
using MisteryApp.Repository.Contexts;
using MisteryApp.Repository.Repositories;

namespace MisteryApp.Repository.Tests.Repositories;

[TestClass]
public class UserProfileRepositoryTests
{
    private IDbContextFactory<ApplicationDbContext> contextFactory = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        contextFactory = new TestDbContextFactory(options);
    }

    [TestMethod]
    public async Task UserProfileAddAsync_ShouldPersistAndReturnProfile_WhenCalled()
    {
        // Arrange
        var repo = new UserProfileRepository(contextFactory);
        var profile = new UserProfile { Name = "Alice", DietStyle = DietStyle.Keto, CreatedAt = DateTime.UtcNow };

        // Act
        var result = await repo.UserProfileAddAsync(profile, CancellationToken.None);

        // Assert
        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("Alice");
        result.DietStyle.Should().Be(DietStyle.Keto);
    }

    [TestMethod]
    public async Task UserProfileSingleOrDefaultByIdAsync_ShouldReturnProfile_WhenExists()
    {
        // Arrange
        var repo = new UserProfileRepository(contextFactory);
        var added = await repo.UserProfileAddAsync(
            new UserProfile { Name = "Bob", DietStyle = DietStyle.LowFat, CreatedAt = DateTime.UtcNow },
            CancellationToken.None);

        // Act
        var result = await repo.UserProfileSingleOrDefaultByIdAsync(added.Id, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Bob");
    }

    [TestMethod]
    public async Task UserProfileSingleOrDefaultByIdAsync_ShouldReturnNull_WhenNotFound()
    {
        // Arrange
        var repo = new UserProfileRepository(contextFactory);

        // Act
        var result = await repo.UserProfileSingleOrDefaultByIdAsync(999, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [TestMethod]
    public async Task UserProfileSingleByIdAsync_ShouldThrowNotFoundException_WhenNotFound()
    {
        // Arrange
        var repo = new UserProfileRepository(contextFactory);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => repo.UserProfileSingleByIdAsync(999, CancellationToken.None));
    }

    [TestMethod]
    public async Task UserProfileUpdateAsync_ShouldPersistChanges_WhenCalled()
    {
        // Arrange
        var repo = new UserProfileRepository(contextFactory);
        var added = await repo.UserProfileAddAsync(
            new UserProfile { Name = "Carol", DietStyle = DietStyle.Keto, CreatedAt = DateTime.UtcNow },
            CancellationToken.None);

        var updated = new UserProfile
        {
            Id = added.Id,
            Name = added.Name,
            DietStyle = DietStyle.Mediterranean,
            CreatedAt = added.CreatedAt
        };

        // Act
        var result = await repo.UserProfileUpdateAsync(updated, CancellationToken.None);

        // Assert
        result.DietStyle.Should().Be(DietStyle.Mediterranean);

        var fetched = await repo.UserProfileSingleOrDefaultByIdAsync(added.Id, CancellationToken.None);
        fetched!.DietStyle.Should().Be(DietStyle.Mediterranean);
    }

    [TestMethod]
    public async Task UserProfileDeleteAsync_ShouldRemoveProfile_WhenCalled()
    {
        // Arrange
        var repo = new UserProfileRepository(contextFactory);
        var added = await repo.UserProfileAddAsync(
            new UserProfile { Name = "Dave", DietStyle = DietStyle.Keto, CreatedAt = DateTime.UtcNow },
            CancellationToken.None);

        // Act
        await repo.UserProfileDeleteAsync(added.Id, CancellationToken.None);

        // Assert
        var result = await repo.UserProfileSingleOrDefaultByIdAsync(added.Id, CancellationToken.None);
        result.Should().BeNull();
    }
}


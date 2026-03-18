using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Models;
using MisteryApp.Repository.Contexts;
using MisteryApp.Repository.Entities;
using MisteryApp.Repository.Repositories;

namespace MisteryApp.Repository.Tests.Repositories;

[TestClass]
public class FoodLogRepositoryTests
{
    private IDbContextFactory<ApplicationDbContext> contextFactory = null!;
    private int seededUserId;

    [TestInitialize]
    public async Task Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        contextFactory = new TestDbContextFactory(options);

        // Seed a user (let EF generate the Id) so food entries have a valid UserId
        await using var ctx = await contextFactory.CreateDbContextAsync();
        var user = ctx.UserProfiles.Add(new UserProfileEntity
        {
            Name = "Alice",
            DietStyle = "Keto",
            CreatedAt = DateTime.UtcNow
        });
        await ctx.SaveChangesAsync();
        seededUserId = user.Entity.Id;
    }

    [TestMethod]
    public async Task FoodEntryAddAsync_ShouldPersistAndReturnEntry_WhenCalled()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);
        var entry = new FoodEntry
        {
            UserId = seededUserId,
            FoodName = "Chicken breast",
            EstimatedCalories = 300,
            Source = FoodEntrySource.Manual,
            LoggedAt = DateTime.UtcNow
        };

        // Act
        var result = await repo.FoodEntryAddAsync(entry, CancellationToken.None);

        // Assert
        result.Id.Should().BeGreaterThan(0);
        result.FoodName.Should().Be("Chicken breast");
        result.EstimatedCalories.Should().Be(300);
        result.Source.Should().Be(FoodEntrySource.Manual);
    }

    [TestMethod]
    public async Task FoodEntrySingleOrDefaultByIdAsync_ShouldReturnEntry_WhenExists()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);
        var added = await repo.FoodEntryAddAsync(
            new FoodEntry { UserId = seededUserId, FoodName = "Salad", EstimatedCalories = 120, Source = FoodEntrySource.Manual, LoggedAt = DateTime.UtcNow },
            CancellationToken.None);

        // Act
        var result = await repo.FoodEntrySingleOrDefaultByIdAsync(added.Id, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.FoodName.Should().Be("Salad");
    }

    [TestMethod]
    public async Task FoodEntrySingleOrDefaultByIdAsync_ShouldReturnNull_WhenNotFound()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);

        // Act
        var result = await repo.FoodEntrySingleOrDefaultByIdAsync(9999, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [TestMethod]
    public async Task FoodEntrySingleByIdAsync_ShouldThrowNotFoundException_WhenNotFound()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => repo.FoodEntrySingleByIdAsync(9999, CancellationToken.None));
    }

    [TestMethod]
    public async Task FoodEntryDeleteAsync_ShouldRemoveEntry_WhenCalled()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);
        var added = await repo.FoodEntryAddAsync(
            new FoodEntry { UserId = seededUserId, FoodName = "Pizza", EstimatedCalories = 600, Source = FoodEntrySource.Photo, LoggedAt = DateTime.UtcNow },
            CancellationToken.None);

        // Act
        await repo.FoodEntryDeleteAsync(added.Id, CancellationToken.None);

        // Assert
        var result = await repo.FoodEntrySingleOrDefaultByIdAsync(added.Id, CancellationToken.None);
        result.Should().BeNull();
    }

    [TestMethod]
    public async Task FoodEntryUpdateAnalysisAsync_ShouldUpdateAnalysisResult_WhenEntryExists()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);
        var added = await repo.FoodEntryAddAsync(
            new FoodEntry { UserId = seededUserId, FoodName = "Salad", EstimatedCalories = 120, Source = FoodEntrySource.Manual, LoggedAt = DateTime.UtcNow },
            CancellationToken.None);
        const string analysisJson = """{"Compatible":true,"Severity":"None","EducationText":"","AlternativeFoodName":null}""";

        // Act
        await repo.FoodEntryUpdateAnalysisAsync(added.Id, analysisJson, CancellationToken.None);

        // Assert
        var updated = await repo.FoodEntrySingleOrDefaultByIdAsync(added.Id, CancellationToken.None);
        updated!.AnalysisResult.Should().Be(analysisJson);
    }

    [TestMethod]
    public async Task FoodEntryUpdateAnalysisAsync_ShouldThrowNotFoundException_WhenEntryNotFound()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => repo.FoodEntryUpdateAnalysisAsync(9999, "{}", CancellationToken.None));
    }

    [TestMethod]
    public async Task FoodEntryGetByUserAndDateAsync_ShouldReturnEntries_WhenTheyExistForDate()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);
        var targetDate = new DateOnly(2026, 3, 18);
        var loggedAt = new DateTime(2026, 3, 18, 12, 0, 0, DateTimeKind.Utc);
        await repo.FoodEntryAddAsync(
            new FoodEntry { UserId = seededUserId, FoodName = "Eggs", EstimatedCalories = 200, Source = FoodEntrySource.Manual, LoggedAt = loggedAt },
            CancellationToken.None);
        await repo.FoodEntryAddAsync(
            new FoodEntry { UserId = seededUserId, FoodName = "Coffee", EstimatedCalories = 10, Source = FoodEntrySource.Manual, LoggedAt = loggedAt },
            CancellationToken.None);

        // Act
        var result = await repo.FoodEntryGetByUserAndDateAsync(seededUserId, targetDate, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(e => e.FoodName == "Eggs");
        result.Should().Contain(e => e.FoodName == "Coffee");
    }

    [TestMethod]
    public async Task FoodEntryGetByUserAndDateAsync_ShouldReturnEmpty_WhenNoEntriesForDate()
    {
        // Arrange
        var repo = new FoodLogRepository(contextFactory);
        var emptyDate = new DateOnly(2026, 1, 1);

        // Act
        var result = await repo.FoodEntryGetByUserAndDateAsync(seededUserId, emptyDate, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }
}

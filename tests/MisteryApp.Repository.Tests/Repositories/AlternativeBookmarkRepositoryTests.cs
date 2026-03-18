using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Models;
using MisteryApp.Repository.Contexts;
using MisteryApp.Repository.Entities;
using MisteryApp.Repository.Repositories;

namespace MisteryApp.Repository.Tests.Repositories;

[TestClass]
public class AlternativeBookmarkRepositoryTests
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
    public async Task BookmarkAddAsync_ShouldPersistAndReturnBookmark()
    {
        // Arrange
        var repo = new AlternativeBookmarkRepository(contextFactory);
        var bookmark = new AlternativeBookmark
        {
            UserId = seededUserId,
            AlternativeFoodName = "Zucchini noodles",
            ImageBase64 = null,
            MimeType = null,
            CreatedAt = DateTime.UtcNow
        };

        // Act
        var result = await repo.BookmarkAddAsync(bookmark, CancellationToken.None);

        // Assert
        result.Id.Should().BeGreaterThan(0);
        result.AlternativeFoodName.Should().Be("Zucchini noodles");
        result.UserId.Should().Be(seededUserId);
    }

    [TestMethod]
    public async Task BookmarkSingleByIdAsync_ShouldThrowNotFoundException_WhenMissing()
    {
        // Arrange
        var repo = new AlternativeBookmarkRepository(contextFactory);

        // Act & Assert
        await repo.Invoking(r => r.BookmarkSingleByIdAsync(9999, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }

    [TestMethod]
    public async Task BookmarkGetByUserAsync_ShouldReturnUserBookmarks_OrderedByCreatedAtDesc()
    {
        // Arrange
        var repo = new AlternativeBookmarkRepository(contextFactory);
        var older = new AlternativeBookmark { UserId = seededUserId, AlternativeFoodName = "Cauli rice", CreatedAt = DateTime.UtcNow.AddHours(-1) };
        var newer = new AlternativeBookmark { UserId = seededUserId, AlternativeFoodName = "Zucchini noodles", CreatedAt = DateTime.UtcNow };
        await repo.BookmarkAddAsync(older, CancellationToken.None);
        await repo.BookmarkAddAsync(newer, CancellationToken.None);

        // Act
        var result = await repo.BookmarkGetByUserAsync(seededUserId, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result[0].AlternativeFoodName.Should().Be("Zucchini noodles");
        result[1].AlternativeFoodName.Should().Be("Cauli rice");
    }

    [TestMethod]
    public async Task BookmarkDeleteAsync_ShouldRemoveBookmark()
    {
        // Arrange
        var repo = new AlternativeBookmarkRepository(contextFactory);
        var bookmark = new AlternativeBookmark { UserId = seededUserId, AlternativeFoodName = "Flatbread", CreatedAt = DateTime.UtcNow };
        var saved = await repo.BookmarkAddAsync(bookmark, CancellationToken.None);

        // Act
        await repo.BookmarkDeleteAsync(saved.Id, CancellationToken.None);

        // Assert
        await repo.Invoking(r => r.BookmarkSingleByIdAsync(saved.Id, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }
}

using FluentAssertions;
using Microsoft.Extensions.Time.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;
using MisteryApp.Implementation.Services;

namespace MisteryApp.Implementation.Tests.Services;

[TestClass]
public class AlternativeBookmarkServiceTests
{
    private Mock<IAlternativeBookmarkRepository> bookmarkRepositoryMock = new(MockBehavior.Strict);
    private Mock<IUserProfileRepository> userProfileRepositoryMock = new(MockBehavior.Strict);
    private FakeTimeProvider timeProvider = null!;
    private Mock<AlternativeBookmarkService> serviceMock = null!;

    [TestInitialize]
    public void Setup()
    {
        timeProvider = new FakeTimeProvider();
        timeProvider.SetUtcNow(new DateTimeOffset(2026, 3, 18, 10, 0, 0, TimeSpan.Zero));
        serviceMock = new Mock<AlternativeBookmarkService>(
            () => new AlternativeBookmarkService(
                bookmarkRepositoryMock.Object,
                userProfileRepositoryMock.Object,
                timeProvider),
            MockBehavior.Strict);
    }

    [TestMethod]
    public async Task CreateBookmarkAsync_ShouldReturnBookmark_WhenUserExists()
    {
        // Arrange
        var request = new CreateBookmarkRequest(1, "Zucchini noodles", null, null);
        var user = new UserProfile { Id = 1, Name = "Alice" };
        var expectedNow = timeProvider.GetUtcNow().UtcDateTime;
        var savedBookmark = new AlternativeBookmark
        {
            Id = 1, UserId = 1, AlternativeFoodName = "Zucchini noodles", CreatedAt = expectedNow
        };
        var ct = CancellationToken.None;

        serviceMock
            .Setup(s => s.CreateBookmarkAsync(request, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(1, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        bookmarkRepositoryMock
            .Setup(r => r.BookmarkAddAsync(
                It.Is<AlternativeBookmark>(b => b.UserId == 1 && b.AlternativeFoodName == "Zucchini noodles" && b.CreatedAt == expectedNow),
                ct))
            .ReturnsAsync(savedBookmark)
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.CreateBookmarkAsync(request, ct);

        // Assert
        result.Id.Should().Be(1);
        result.AlternativeFoodName.Should().Be("Zucchini noodles");
        serviceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        bookmarkRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task CreateBookmarkAsync_ShouldThrowNotFoundException_WhenUserNotFound()
    {
        // Arrange
        var request = new CreateBookmarkRequest(999, "Salad", null, null);
        var ct = CancellationToken.None;

        serviceMock
            .Setup(s => s.CreateBookmarkAsync(request, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(999, ct))
            .ThrowsAsync(new NotFoundException("User not found."))
            .Verifiable(Times.Once());

        // Act & Assert
        await serviceMock.Object.Invoking(s => s.CreateBookmarkAsync(request, ct))
            .Should().ThrowAsync<NotFoundException>();
        serviceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        bookmarkRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task DeleteBookmarkAsync_ShouldDelete_WhenBookmarkExists()
    {
        // Arrange
        var bookmark = new AlternativeBookmark { Id = 5, UserId = 1, AlternativeFoodName = "Cauli rice" };
        var ct = CancellationToken.None;

        serviceMock
            .Setup(s => s.DeleteBookmarkAsync(5, ct))
            .CallBase()
            .Verifiable(Times.Once());
        bookmarkRepositoryMock
            .Setup(r => r.BookmarkSingleByIdAsync(5, ct))
            .ReturnsAsync(bookmark)
            .Verifiable(Times.Once());
        bookmarkRepositoryMock
            .Setup(r => r.BookmarkDeleteAsync(5, ct))
            .Returns(Task.CompletedTask)
            .Verifiable(Times.Once());

        // Act
        await serviceMock.Object.DeleteBookmarkAsync(5, ct);

        // Assert
        serviceMock.VerifyAll();
        bookmarkRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetUserBookmarksAsync_ShouldReturnBookmarks_WhenUserHasBookmarks()
    {
        // Arrange
        var userId = 1;
        var ct = CancellationToken.None;
        var bookmarks = new List<AlternativeBookmark>
        {
            new() { Id = 1, UserId = userId, AlternativeFoodName = "Cauli rice" },
            new() { Id = 2, UserId = userId, AlternativeFoodName = "Zucchini noodles" }
        };

        serviceMock
            .Setup(s => s.GetUserBookmarksAsync(userId, ct))
            .CallBase()
            .Verifiable(Times.Once());
        bookmarkRepositoryMock
            .Setup(r => r.BookmarkGetByUserAsync(userId, ct))
            .ReturnsAsync(bookmarks)
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.GetUserBookmarksAsync(userId, ct);

        // Assert
        result.Should().HaveCount(2);
        result[0].AlternativeFoodName.Should().Be("Cauli rice");
        serviceMock.VerifyAll();
        bookmarkRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }
}

using FluentAssertions;
using Microsoft.Extensions.Time.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;
using MisteryApp.Implementation.Services;

namespace MisteryApp.Implementation.Tests.Services;

[TestClass]
public class UserProfileServiceTests
{
    private Mock<IUserProfileRepository> userProfileRepositoryMock = new(MockBehavior.Strict);
    private FakeTimeProvider timeProvider = null!;
    private Mock<UserProfileService> userProfileServiceMock = null!;

    [TestInitialize]
    public void Setup()
    {
        timeProvider = new FakeTimeProvider();
        timeProvider.SetUtcNow(new DateTimeOffset(2026, 3, 18, 10, 0, 0, TimeSpan.Zero));

        userProfileServiceMock = new Mock<UserProfileService>(
            () => new UserProfileService(userProfileRepositoryMock.Object, timeProvider),
            MockBehavior.Strict);
    }

    [TestMethod]
    public async Task CreateUserProfileAsync_ShouldReturnUserProfile_WhenRequestIsValid()
    {
        // Arrange
        var request = new CreateUserProfileRequest("Alice", DietStyle.Keto);
        var expectedNow = timeProvider.GetUtcNow().UtcDateTime;
        var expectedProfile = new UserProfile
        {
            Id = 1, Name = "Alice", DietStyle = DietStyle.Keto,
            CreatedAt = expectedNow, LastActiveAt = expectedNow
        };
        var cancellationToken = CancellationToken.None;

        userProfileServiceMock
            .Setup(s => s.CreateUserProfileAsync(request, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileAddAsync(
                It.Is<UserProfile>(p => p.Name == "Alice" && p.DietStyle == DietStyle.Keto && p.CreatedAt == expectedNow),
                cancellationToken))
            .ReturnsAsync(expectedProfile)
            .Verifiable(Times.Once());

        // Act
        var result = await userProfileServiceMock.Object.CreateUserProfileAsync(request, cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.Name.Should().Be("Alice");
        result.DietStyle.Should().Be(DietStyle.Keto);

        userProfileServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetUserProfileByIdAsync_ShouldReturnProfile_WhenUserExists()
    {
        // Arrange
        var userId = 1;
        var expectedProfile = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto };
        var cancellationToken = CancellationToken.None;

        userProfileServiceMock
            .Setup(s => s.GetUserProfileByIdAsync(userId, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleOrDefaultByIdAsync(userId, cancellationToken))
            .ReturnsAsync(expectedProfile)
            .Verifiable(Times.Once());

        // Act
        var result = await userProfileServiceMock.Object.GetUserProfileByIdAsync(userId, cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);

        userProfileServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetUserProfileByIdAsync_ShouldReturnNull_WhenUserNotFound()
    {
        // Arrange
        var userId = 99;
        var cancellationToken = CancellationToken.None;

        userProfileServiceMock
            .Setup(s => s.GetUserProfileByIdAsync(userId, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleOrDefaultByIdAsync(userId, cancellationToken))
            .ReturnsAsync((UserProfile?)null)
            .Verifiable(Times.Once());

        // Act
        var result = await userProfileServiceMock.Object.GetUserProfileByIdAsync(userId, cancellationToken);

        // Assert
        result.Should().BeNull();

        userProfileServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task UpdateUserProfileAsync_ShouldReturnUpdatedProfile_WhenUserExists()
    {
        // Arrange
        var userId = 1;
        var request = new UpdateUserProfileRequest(DietStyle.Mediterranean);
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var existingProfile = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto, CreatedAt = now };
        var updatedProfile = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Mediterranean, CreatedAt = now, LastActiveAt = now };
        var cancellationToken = CancellationToken.None;

        userProfileServiceMock
            .Setup(s => s.UpdateUserProfileAsync(userId, request, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, cancellationToken))
            .ReturnsAsync(existingProfile)
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileUpdateAsync(
                It.Is<UserProfile>(p => p.Id == userId && p.DietStyle == DietStyle.Mediterranean),
                cancellationToken))
            .ReturnsAsync(updatedProfile)
            .Verifiable(Times.Once());

        // Act
        var result = await userProfileServiceMock.Object.UpdateUserProfileAsync(userId, request, cancellationToken);

        // Assert
        result.DietStyle.Should().Be(DietStyle.Mediterranean);

        userProfileServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task UpdateUserProfileAsync_ShouldThrowNotFoundException_WhenUserNotFound()
    {
        // Arrange
        var userId = 99;
        var request = new UpdateUserProfileRequest(DietStyle.LowFat);
        var cancellationToken = CancellationToken.None;

        userProfileServiceMock
            .Setup(s => s.UpdateUserProfileAsync(userId, request, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, cancellationToken))
            .ThrowsAsync(new NotFoundException($"User profile not found (UserId: {userId})."))
            .Verifiable(Times.Once());

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => userProfileServiceMock.Object.UpdateUserProfileAsync(userId, request, cancellationToken));

        exception.Message.Should().Contain(userId.ToString());

        userProfileServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task DeleteUserProfileAsync_ShouldCallRepository_WhenUserExists()
    {
        // Arrange
        var userId = 1;
        var existingProfile = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto };
        var cancellationToken = CancellationToken.None;

        userProfileServiceMock
            .Setup(s => s.DeleteUserProfileAsync(userId, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, cancellationToken))
            .ReturnsAsync(existingProfile)
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileDeleteAsync(userId, cancellationToken))
            .Returns(Task.CompletedTask)
            .Verifiable(Times.Once());

        // Act
        await userProfileServiceMock.Object.DeleteUserProfileAsync(userId, cancellationToken);

        // Assert
        userProfileServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task DeleteUserProfileAsync_ShouldThrowNotFoundException_WhenUserNotFound()
    {
        // Arrange
        var userId = 99;
        var cancellationToken = CancellationToken.None;

        userProfileServiceMock
            .Setup(s => s.DeleteUserProfileAsync(userId, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, cancellationToken))
            .ThrowsAsync(new NotFoundException($"User profile not found (UserId: {userId})."))
            .Verifiable(Times.Once());

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => userProfileServiceMock.Object.DeleteUserProfileAsync(userId, cancellationToken));

        exception.Message.Should().Contain(userId.ToString());

        userProfileServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }
}

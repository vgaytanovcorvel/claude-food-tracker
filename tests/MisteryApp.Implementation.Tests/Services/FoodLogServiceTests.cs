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
public class FoodLogServiceTests
{
    private Mock<IFoodLogRepository> foodLogRepositoryMock = new(MockBehavior.Strict);
    private Mock<IUserProfileRepository> userProfileRepositoryMock = new(MockBehavior.Strict);
    private Mock<IFoodAnalysisService> foodAnalysisServiceMock = new(MockBehavior.Strict);
    private Mock<IAlternativeImageService> alternativeImageServiceMock = new(MockBehavior.Strict);
    private FakeTimeProvider timeProvider = null!;
    private Mock<FoodLogService> foodLogServiceMock = null!;

    [TestInitialize]
    public void Setup()
    {
        timeProvider = new FakeTimeProvider();
        timeProvider.SetUtcNow(new DateTimeOffset(2026, 3, 18, 12, 0, 0, TimeSpan.Zero));

        foodLogServiceMock = new Mock<FoodLogService>(
            () => new FoodLogService(
                foodLogRepositoryMock.Object,
                userProfileRepositoryMock.Object,
                foodAnalysisServiceMock.Object,
                alternativeImageServiceMock.Object,
                timeProvider),
            MockBehavior.Strict);
    }

    [TestMethod]
    public async Task AddFoodEntryAsync_ShouldReturnFoodEntry_WhenRequestIsValid()
    {
        // Arrange
        var request = new CreateFoodEntryRequest(1, "Chicken breast", 300, FoodEntrySource.Manual);
        var expectedNow = timeProvider.GetUtcNow().UtcDateTime;
        var existingUser = new UserProfile { Id = 1, Name = "Alice", DietStyle = DietStyle.Keto };
        var expectedEntry = new FoodEntry
        {
            Id = 1,
            UserId = 1,
            FoodName = "Chicken breast",
            EstimatedCalories = 300,
            Source = FoodEntrySource.Manual,
            LoggedAt = expectedNow
        };
        var cancellationToken = CancellationToken.None;

        foodLogServiceMock
            .Setup(s => s.AddFoodEntryAsync(request, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(1, cancellationToken))
            .ReturnsAsync(existingUser)
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntryAddAsync(
                It.Is<FoodEntry>(e =>
                    e.UserId == 1 &&
                    e.FoodName == "Chicken breast" &&
                    e.EstimatedCalories == 300 &&
                    e.Source == FoodEntrySource.Manual &&
                    e.LoggedAt == expectedNow),
                cancellationToken))
            .ReturnsAsync(expectedEntry)
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileUpdateLastActiveAtAsync(1, expectedNow, cancellationToken))
            .Returns(Task.CompletedTask)
            .Verifiable(Times.Once());

        // Act
        var result = await foodLogServiceMock.Object.AddFoodEntryAsync(request, cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.FoodName.Should().Be("Chicken breast");
        result.EstimatedCalories.Should().Be(300);
        result.Source.Should().Be(FoodEntrySource.Manual);

        foodLogServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task AddFoodEntryAsync_ShouldThrowNotFoundException_WhenUserNotFound()
    {
        // Arrange
        var request = new CreateFoodEntryRequest(999, "Rice", 250, FoodEntrySource.Manual);
        var cancellationToken = CancellationToken.None;

        foodLogServiceMock
            .Setup(s => s.AddFoodEntryAsync(request, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(999, cancellationToken))
            .ThrowsAsync(new NotFoundException("User profile not found (UserId: 999)."))
            .Verifiable(Times.Once());

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => foodLogServiceMock.Object.AddFoodEntryAsync(request, cancellationToken));

        exception.Message.Should().Contain("999");

        foodLogServiceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task DeleteFoodEntryAsync_ShouldCallRepository_WhenEntryExists()
    {
        // Arrange
        var entryId = 5;
        var existingEntry = new FoodEntry { Id = entryId, UserId = 1, FoodName = "Salad", EstimatedCalories = 120 };
        var cancellationToken = CancellationToken.None;

        foodLogServiceMock
            .Setup(s => s.DeleteFoodEntryAsync(entryId, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntrySingleByIdAsync(entryId, cancellationToken))
            .ReturnsAsync(existingEntry)
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntryDeleteAsync(entryId, cancellationToken))
            .Returns(Task.CompletedTask)
            .Verifiable(Times.Once());

        // Act
        await foodLogServiceMock.Object.DeleteFoodEntryAsync(entryId, cancellationToken);

        // Assert
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task DeleteFoodEntryAsync_ShouldThrowNotFoundException_WhenEntryNotFound()
    {
        // Arrange
        var entryId = 999;
        var cancellationToken = CancellationToken.None;

        foodLogServiceMock
            .Setup(s => s.DeleteFoodEntryAsync(entryId, cancellationToken))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntrySingleByIdAsync(entryId, cancellationToken))
            .ThrowsAsync(new NotFoundException($"Food entry not found (EntryId: {entryId})."))
            .Verifiable(Times.Once());

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => foodLogServiceMock.Object.DeleteFoodEntryAsync(entryId, cancellationToken));

        exception.Message.Should().Contain(entryId.ToString());

        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalyseFoodEntryAsync_ShouldReturnFoodAnalysisResult_WhenEntryAndUserExist()
    {
        // Arrange
        var entryId = 1;
        var ct = CancellationToken.None;
        var entry = new FoodEntry { Id = entryId, UserId = 1, FoodName = "Rice Noodles", EstimatedCalories = 350 };
        var user = new UserProfile { Id = 1, Name = "Alice", DietStyle = DietStyle.Keto };
        var expectedResult = new FoodAnalysisResult(false, AnalysisSeverity.Medium, "High carb load.", "Zucchini Noodles");

        foodLogServiceMock
            .Setup(s => s.AnalyseFoodEntryAsync(entryId, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntrySingleByIdAsync(entryId, ct))
            .ReturnsAsync(entry)
            .Verifiable(Times.Once());

        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(1, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());

        foodAnalysisServiceMock
            .Setup(s => s.AnalyseFoodAsync("Rice Noodles", DietStyle.Keto, ct))
            .ReturnsAsync(expectedResult)
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntryUpdateAnalysisAsync(entryId, It.IsAny<string>(), ct))
            .Returns(Task.CompletedTask)
            .Verifiable(Times.Once());

        // Act
        var result = await foodLogServiceMock.Object.AnalyseFoodEntryAsync(entryId, ct);

        // Assert
        result.Compatible.Should().BeFalse();
        result.Severity.Should().Be(AnalysisSeverity.Medium);
        result.EducationText.Should().Be("High carb load.");
        result.AlternativeFoodName.Should().Be("Zucchini Noodles");
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalyseFoodEntryAsync_ShouldThrowNotFoundException_WhenEntryNotFound()
    {
        // Arrange
        var entryId = 999;
        var ct = CancellationToken.None;

        foodLogServiceMock
            .Setup(s => s.AnalyseFoodEntryAsync(entryId, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntrySingleByIdAsync(entryId, ct))
            .ThrowsAsync(new NotFoundException($"Food entry not found (EntryId: {entryId})."))
            .Verifiable(Times.Once());

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => foodLogServiceMock.Object.AnalyseFoodEntryAsync(entryId, ct));

        exception.Message.Should().Contain(entryId.ToString());
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetDailyEntriesAsync_ShouldReturnEntriesFromRepository_WhenCalled()
    {
        // Arrange
        var userId = 1;
        var date = new DateOnly(2026, 3, 18);
        var ct = CancellationToken.None;
        var expectedEntries = new List<FoodEntry>
        {
            new() { Id = 1, UserId = userId, FoodName = "Eggs", EstimatedCalories = 200 },
            new() { Id = 2, UserId = userId, FoodName = "Coffee", EstimatedCalories = 10 }
        };

        foodLogServiceMock
            .Setup(s => s.GetDailyEntriesAsync(userId, date, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateAsync(userId, date, ct))
            .ReturnsAsync(expectedEntries)
            .Verifiable(Times.Once());

        // Act
        var result = await foodLogServiceMock.Object.GetDailyEntriesAsync(userId, date, ct);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(e => e.FoodName == "Eggs");
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetDailySummaryAsync_ShouldReturnCorrectCounts_WhenEntriesHaveAnalysis()
    {
        // Arrange
        var userId = 1;
        var date = new DateOnly(2026, 3, 18);
        var ct = CancellationToken.None;
        var compatibleJson = """{"Compatible":true,"Severity":"None","EducationText":"Great!","AlternativeFoodName":null}""";
        var conflictJson = """{"Compatible":false,"Severity":"Medium","EducationText":"High carbs.","AlternativeFoodName":"Zucchini Noodles"}""";
        var entries = new List<FoodEntry>
        {
            new() { Id = 1, UserId = userId, FoodName = "Chicken", EstimatedCalories = 300, AnalysisResult = compatibleJson },
            new() { Id = 2, UserId = userId, FoodName = "Rice", EstimatedCalories = 350, AnalysisResult = conflictJson },
            new() { Id = 3, UserId = userId, FoodName = "Water", EstimatedCalories = 0, AnalysisResult = null }
        };

        foodLogServiceMock
            .Setup(s => s.GetDailySummaryAsync(userId, date, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateAsync(userId, date, ct))
            .ReturnsAsync(entries)
            .Verifiable(Times.Once());

        // Act
        var result = await foodLogServiceMock.Object.GetDailySummaryAsync(userId, date, ct);

        // Assert
        result.TotalCalories.Should().Be(650);
        result.OnGoalCount.Should().Be(1);
        result.ConflictCount.Should().Be(1);
        result.ComplianceLabel.Should().Be("1 of 2 meals on goal");
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetDailySummaryAsync_ShouldReturnNoAnalysisLabel_WhenNoEntriesHaveAnalysis()
    {
        // Arrange
        var userId = 1;
        var date = new DateOnly(2026, 3, 18);
        var ct = CancellationToken.None;
        var entries = new List<FoodEntry>
        {
            new() { Id = 1, UserId = userId, FoodName = "Water", EstimatedCalories = 0, AnalysisResult = null }
        };

        foodLogServiceMock
            .Setup(s => s.GetDailySummaryAsync(userId, date, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateAsync(userId, date, ct))
            .ReturnsAsync(entries)
            .Verifiable(Times.Once());

        // Act
        var result = await foodLogServiceMock.Object.GetDailySummaryAsync(userId, date, ct);

        // Assert
        result.TotalCalories.Should().Be(0);
        result.OnGoalCount.Should().Be(0);
        result.ConflictCount.Should().Be(0);
        result.ComplianceLabel.Should().Be("No meals analysed yet");
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetAlternativeImageForEntryAsync_ShouldReturnImage_WhenEntryHasAlternativeFood()
    {
        // Arrange
        var entryId = 1;
        var ct = CancellationToken.None;
        const string conflictJson = """{"Compatible":false,"Severity":"Medium","EducationText":"High carbs.","AlternativeFoodName":"Zucchini Noodles"}""";
        var entry = new FoodEntry { Id = entryId, UserId = 1, FoodName = "Rice Noodles", EstimatedCalories = 350, AnalysisResult = conflictJson };
        var imageResult = new AlternativeImageResult("base64imagedata==", "image/png");

        foodLogServiceMock
            .Setup(s => s.GetAlternativeImageForEntryAsync(entryId, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntrySingleByIdAsync(entryId, ct))
            .ReturnsAsync(entry)
            .Verifiable(Times.Once());

        alternativeImageServiceMock
            .Setup(s => s.GenerateAlternativeImageAsync("Zucchini Noodles", 1, ct))
            .ReturnsAsync(imageResult)
            .Verifiable(Times.Once());

        // Act
        var result = await foodLogServiceMock.Object.GetAlternativeImageForEntryAsync(entryId, ct);

        // Assert
        result.Should().NotBeNull();
        result.ImageBase64.Should().Be("base64imagedata==");
        result.MimeType.Should().Be("image/png");
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetAlternativeImageForEntryAsync_ShouldReturnEmpty_WhenEntryHasNoAnalysis()
    {
        // Arrange
        var entryId = 2;
        var ct = CancellationToken.None;
        var entry = new FoodEntry { Id = entryId, UserId = 1, FoodName = "Water", EstimatedCalories = 0, AnalysisResult = null };

        foodLogServiceMock
            .Setup(s => s.GetAlternativeImageForEntryAsync(entryId, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntrySingleByIdAsync(entryId, ct))
            .ReturnsAsync(entry)
            .Verifiable(Times.Once());

        // Act
        var result = await foodLogServiceMock.Object.GetAlternativeImageForEntryAsync(entryId, ct);

        // Assert
        result.ImageBase64.Should().BeNull();
        result.MimeType.Should().BeNull();
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetAlternativeImageForEntryAsync_ShouldThrowNotFoundException_WhenEntryNotFound()
    {
        // Arrange
        var entryId = 999;
        var ct = CancellationToken.None;

        foodLogServiceMock
            .Setup(s => s.GetAlternativeImageForEntryAsync(entryId, ct))
            .CallBase()
            .Verifiable(Times.Once());

        foodLogRepositoryMock
            .Setup(r => r.FoodEntrySingleByIdAsync(entryId, ct))
            .ThrowsAsync(new NotFoundException($"Food entry not found (EntryId: {entryId})."))
            .Verifiable(Times.Once());

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<NotFoundException>(
            () => foodLogServiceMock.Object.GetAlternativeImageForEntryAsync(entryId, ct));

        exception.Message.Should().Contain(entryId.ToString());
        foodLogServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
        foodAnalysisServiceMock.VerifyAll();
        alternativeImageServiceMock.VerifyAll();
    }
}

using FluentAssertions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Services;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MisteryApp.Implementation.Tests.Services;

[TestClass]
public class ReportServiceTests
{
    private Mock<IFoodLogRepository> foodLogRepositoryMock = new(MockBehavior.Strict);
    private Mock<IUserProfileRepository> userProfileRepositoryMock = new(MockBehavior.Strict);
    private Mock<ReportService> reportServiceMock = null!;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };

    [TestInitialize]
    public void Setup()
    {
        reportServiceMock = new Mock<ReportService>(
            () => new ReportService(
                foodLogRepositoryMock.Object,
                userProfileRepositoryMock.Object),
            MockBehavior.Strict);
    }

    [TestMethod]
    public async Task GetWeeklyReportAsync_ShouldReturnReport_WhenUserHasEntries()
    {
        // Arrange
        var userId = 1;
        var weekStart = new DateOnly(2026, 3, 16); // Monday
        var weekEnd = weekStart.AddDays(6);
        var ct = CancellationToken.None;
        var user = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto };
        var entries = new List<FoodEntry>
        {
            new() { Id = 1, UserId = userId, FoodName = "Eggs", EstimatedCalories = 200,
                LoggedAt = new DateTime(2026, 3, 16, 8, 0, 0, DateTimeKind.Utc),
                Source = FoodEntrySource.Manual, AnalysisResult = null }
        };

        reportServiceMock
            .Setup(s => s.GetWeeklyReportAsync(userId, weekStart, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateRangeAsync(userId, weekStart, weekEnd, ct))
            .ReturnsAsync(entries)
            .Verifiable(Times.Once());

        // Act
        var result = await reportServiceMock.Object.GetWeeklyReportAsync(userId, weekStart, ct);

        // Assert
        result.Should().NotBeNull();
        result.WeekStart.Should().Be(weekStart);
        result.WeekEnd.Should().Be(weekEnd);
        result.DailySummaries.Should().HaveCount(7);
        result.TotalCalories.Should().Be(200);
        result.PatternInsight.Should().BeNull(); // weekly never produces pattern — each DoW appears at most once
        result.DailySummaries.First(d => d.Date == weekStart).HasEntries.Should().BeTrue();
        reportServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetWeeklyReportAsync_ShouldReturnEmptyReport_WhenNoEntries()
    {
        // Arrange
        var userId = 1;
        var weekStart = new DateOnly(2026, 3, 16);
        var weekEnd = weekStart.AddDays(6);
        var ct = CancellationToken.None;
        var user = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto };

        reportServiceMock
            .Setup(s => s.GetWeeklyReportAsync(userId, weekStart, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateRangeAsync(userId, weekStart, weekEnd, ct))
            .ReturnsAsync(new List<FoodEntry>())
            .Verifiable(Times.Once());

        // Act
        var result = await reportServiceMock.Object.GetWeeklyReportAsync(userId, weekStart, ct);

        // Assert
        result.TotalCalories.Should().Be(0);
        result.ComplianceRate.Should().Be(0);
        result.PatternInsight.Should().BeNull();
        result.DailySummaries.Should().AllSatisfy(d => d.HasEntries.Should().BeFalse());
        result.MotivatingCopy.Should().Be("Nothing logged yet — whenever you're ready.");
        reportServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetWeeklyReportAsync_ShouldReturnAllConflictsCopy_WhenAllMealsConflict()
    {
        // Arrange
        var userId = 1;
        var weekStart = new DateOnly(2026, 3, 16);
        var weekEnd = weekStart.AddDays(6);
        var ct = CancellationToken.None;
        var user = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto };
        var conflictJson = JsonSerializer.Serialize(
            new FoodAnalysisResult(false, AnalysisSeverity.High, "Too many carbs", "Cauli rice"),
            JsonOptions);
        var entries = new List<FoodEntry>
        {
            new() { Id = 1, UserId = userId, FoodName = "Rice", EstimatedCalories = 400,
                LoggedAt = new DateTime(2026, 3, 16, 8, 0, 0, DateTimeKind.Utc),
                Source = FoodEntrySource.Manual, AnalysisResult = conflictJson }
        };

        reportServiceMock
            .Setup(s => s.GetWeeklyReportAsync(userId, weekStart, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateRangeAsync(userId, weekStart, weekEnd, ct))
            .ReturnsAsync(entries)
            .Verifiable(Times.Once());

        // Act
        var result = await reportServiceMock.Object.GetWeeklyReportAsync(userId, weekStart, ct);

        // Assert
        result.ComplianceRate.Should().Be(0);
        result.MotivatingCopy.Should().Be("All logged meals had a conflict — try the suggested alternatives.");
        reportServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetMonthlyReportAsync_ShouldDetectPattern_WhenSufficientConflictsOnSameWeekday()
    {
        // Arrange — 7 analysed entries across multiple Mondays (monthly window)
        var userId = 1;
        var monthStart = new DateOnly(2026, 3, 1);
        var daysInMonth = 31;
        var monthEnd = monthStart.AddDays(daysInMonth - 1);
        var ct = CancellationToken.None;
        var user = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto };
        var conflictJson = JsonSerializer.Serialize(
            new FoodAnalysisResult(false, AnalysisSeverity.High, "Too many carbs", "Cauli rice"),
            JsonOptions);
        // March 2026 Mondays: 2, 9, 16, 23, 30 → 5 Mondays; need >= 7 total + >=2 per DoW
        // Add 7 entries: 5 on Mondays (conflict), 2 on Tuesday (compliant) — Mondays = 5 conflicts = 100% > 50%
        var compatibleJson = JsonSerializer.Serialize(
            new FoodAnalysisResult(true, AnalysisSeverity.None, "Good choice", null), JsonOptions);
        var entries = new List<FoodEntry>
        {
            // 5 conflicting Mondays
            new() { Id = 1, UserId = userId, FoodName = "Rice", EstimatedCalories = 400, LoggedAt = new DateTime(2026, 3, 2, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = conflictJson },
            new() { Id = 2, UserId = userId, FoodName = "Rice", EstimatedCalories = 400, LoggedAt = new DateTime(2026, 3, 9, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = conflictJson },
            new() { Id = 3, UserId = userId, FoodName = "Rice", EstimatedCalories = 400, LoggedAt = new DateTime(2026, 3, 16, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = conflictJson },
            new() { Id = 4, UserId = userId, FoodName = "Rice", EstimatedCalories = 400, LoggedAt = new DateTime(2026, 3, 23, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = conflictJson },
            new() { Id = 5, UserId = userId, FoodName = "Rice", EstimatedCalories = 400, LoggedAt = new DateTime(2026, 3, 30, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = conflictJson },
            // 2 compliant Tuesdays
            new() { Id = 6, UserId = userId, FoodName = "Eggs", EstimatedCalories = 200, LoggedAt = new DateTime(2026, 3, 3, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = compatibleJson },
            new() { Id = 7, UserId = userId, FoodName = "Eggs", EstimatedCalories = 200, LoggedAt = new DateTime(2026, 3, 10, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = compatibleJson },
        };

        reportServiceMock
            .Setup(s => s.GetMonthlyReportAsync(userId, monthStart, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateRangeAsync(userId, monthStart, monthEnd, ct))
            .ReturnsAsync(entries)
            .Verifiable(Times.Once());

        // Act
        var result = await reportServiceMock.Object.GetMonthlyReportAsync(userId, monthStart, ct);

        // Assert
        result.PatternInsight.Should().NotBeNull();
        result.PatternInsight.Should().Contain("keto");
        result.PatternInsight.Should().Contain("Monday");
        reportServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetMonthlyReportAsync_ShouldNotDetectPattern_WhenFewerThan7AnalysedEntries()
    {
        // Arrange
        var userId = 1;
        var monthStart = new DateOnly(2026, 3, 1);
        var daysInMonth = 31;
        var monthEnd = monthStart.AddDays(daysInMonth - 1);
        var ct = CancellationToken.None;
        var user = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Keto };
        var conflictJson = JsonSerializer.Serialize(
            new FoodAnalysisResult(false, AnalysisSeverity.Low, "Off track", "Salad"), JsonOptions);
        var entries = Enumerable.Range(1, 6)
            .Select(i => new FoodEntry
            {
                Id = i, UserId = userId, FoodName = "Pasta", EstimatedCalories = 500,
                LoggedAt = new DateTime(2026, 3, i, 12, 0, 0, DateTimeKind.Utc),
                Source = FoodEntrySource.Manual, AnalysisResult = conflictJson
            })
            .ToList<FoodEntry>();

        reportServiceMock
            .Setup(s => s.GetMonthlyReportAsync(userId, monthStart, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateRangeAsync(userId, monthStart, monthEnd, ct))
            .ReturnsAsync(entries)
            .Verifiable(Times.Once());

        // Act
        var result = await reportServiceMock.Object.GetMonthlyReportAsync(userId, monthStart, ct);

        // Assert
        result.PatternInsight.Should().BeNull();
        reportServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task GetMonthlyReportAsync_ShouldReturnReport_WhenUserHasEntries()
    {
        // Arrange
        var userId = 1;
        var monthStart = new DateOnly(2026, 3, 1);
        var daysInMonth = 31;
        var monthEnd = monthStart.AddDays(daysInMonth - 1);
        var ct = CancellationToken.None;
        var user = new UserProfile { Id = userId, Name = "Alice", DietStyle = DietStyle.Mediterranean };
        var compatibleJson = JsonSerializer.Serialize(
            new FoodAnalysisResult(true, AnalysisSeverity.None, "Great choice!", null), JsonOptions);
        var entries = new List<FoodEntry>
        {
            new() { Id = 1, UserId = userId, FoodName = "Salad", EstimatedCalories = 150, LoggedAt = new DateTime(2026, 3, 5, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = compatibleJson },
            new() { Id = 2, UserId = userId, FoodName = "Fish", EstimatedCalories = 300, LoggedAt = new DateTime(2026, 3, 10, 12, 0, 0, DateTimeKind.Utc), Source = FoodEntrySource.Manual, AnalysisResult = compatibleJson }
        };

        reportServiceMock
            .Setup(s => s.GetMonthlyReportAsync(userId, monthStart, ct))
            .CallBase()
            .Verifiable(Times.Once());
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(userId, ct))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        foodLogRepositoryMock
            .Setup(r => r.FoodEntryGetByUserAndDateRangeAsync(userId, monthStart, monthEnd, ct))
            .ReturnsAsync(entries)
            .Verifiable(Times.Once());

        // Act
        var result = await reportServiceMock.Object.GetMonthlyReportAsync(userId, monthStart, ct);

        // Assert
        result.Should().NotBeNull();
        result.MonthStart.Should().Be(monthStart);
        result.MonthEnd.Should().Be(monthEnd);
        result.DailySummaries.Should().HaveCount(daysInMonth);
        result.TotalCalories.Should().Be(450);
        result.ComplianceRate.Should().Be(1.0);
        reportServiceMock.VerifyAll();
        foodLogRepositoryMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }
}

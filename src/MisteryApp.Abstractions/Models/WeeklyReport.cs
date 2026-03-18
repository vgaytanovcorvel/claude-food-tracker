namespace MisteryApp.Abstractions.Models;

public record WeeklyReport(
    DateOnly WeekStart,
    DateOnly WeekEnd,
    IReadOnlyList<DailyCalorieSummary> DailySummaries,
    int TotalCalories,
    double ComplianceRate,
    string? PatternInsight,
    string MotivatingCopy);

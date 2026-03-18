namespace MisteryApp.Abstractions.Models;

public record MonthlyReport(
    DateOnly MonthStart,
    DateOnly MonthEnd,
    IReadOnlyList<DailyCalorieSummary> DailySummaries,
    int TotalCalories,
    double ComplianceRate,
    string? PatternInsight,
    string MotivatingCopy);

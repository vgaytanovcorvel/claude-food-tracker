namespace MisteryApp.Abstractions.Models;

public record DailyLogSummary(
    DateOnly Date,
    int TotalCalories,
    int OnGoalCount,
    int ConflictCount,
    string ComplianceLabel);

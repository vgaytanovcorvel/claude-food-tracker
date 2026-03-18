namespace MisteryApp.Abstractions.Models;

public record DailyCalorieSummary(
    DateOnly Date,
    int TotalCalories,
    int OnGoalCount,
    int ConflictCount,
    bool HasEntries);

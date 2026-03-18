using System.Text.Json;
using System.Text.Json.Serialization;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;

namespace MisteryApp.Implementation.Services;

public class ReportService(
    IFoodLogRepository foodLogRepository,
    IUserProfileRepository userProfileRepository) : IReportService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public virtual async Task<WeeklyReport> GetWeeklyReportAsync(
        int userId, DateOnly weekStart, CancellationToken cancellationToken)
    {
        var userProfile = await userProfileRepository.UserProfileSingleByIdAsync(userId, cancellationToken);
        var weekEnd = weekStart.AddDays(6);
        var entries = await foodLogRepository.FoodEntryGetByUserAndDateRangeAsync(
            userId, weekStart, weekEnd, cancellationToken);

        var dailySummaries = BuildDailySummaries(entries, weekStart, 7);
        var (totalCalories, complianceRate) = ComputeTotals(dailySummaries);
        var motivatingCopy = BuildMotivatingCopy(complianceRate, dailySummaries.Any(d => d.HasEntries));

        return new WeeklyReport(weekStart, weekEnd, dailySummaries, totalCalories, complianceRate, null, motivatingCopy);
    }

    public virtual async Task<MonthlyReport> GetMonthlyReportAsync(
        int userId, DateOnly monthStart, CancellationToken cancellationToken)
    {
        var userProfile = await userProfileRepository.UserProfileSingleByIdAsync(userId, cancellationToken);
        var daysInMonth = DateTime.DaysInMonth(monthStart.Year, monthStart.Month);
        var monthEnd = monthStart.AddDays(daysInMonth - 1);
        var entries = await foodLogRepository.FoodEntryGetByUserAndDateRangeAsync(
            userId, monthStart, monthEnd, cancellationToken);

        var dailySummaries = BuildDailySummaries(entries, monthStart, daysInMonth);
        var (totalCalories, complianceRate) = ComputeTotals(dailySummaries);
        var patternInsight = DetectPattern(entries, userProfile.DietStyle.ToString());
        var motivatingCopy = BuildMotivatingCopy(complianceRate, dailySummaries.Any(d => d.HasEntries));

        return new MonthlyReport(monthStart, monthEnd, dailySummaries, totalCalories, complianceRate, patternInsight, motivatingCopy);
    }

    private IReadOnlyList<DailyCalorieSummary> BuildDailySummaries(
        IReadOnlyList<FoodEntry> entries, DateOnly start, int days)
    {
        var summaries = new List<DailyCalorieSummary>(days);
        for (var i = 0; i < days; i++)
        {
            var date = start.AddDays(i);
            var dayEntries = entries.Where(e => DateOnly.FromDateTime(e.LoggedAt) == date).ToList();
            int onGoal = 0, conflict = 0;
            foreach (var entry in dayEntries.Where(e => e.AnalysisResult is not null))
            {
                var analysis = TryDeserializeAnalysis(entry.AnalysisResult!);
                if (analysis is null) continue;
                if (analysis.Compatible) onGoal++;
                else conflict++;
            }
            summaries.Add(new DailyCalorieSummary(
                date,
                dayEntries.Sum(e => e.EstimatedCalories),
                onGoal,
                conflict,
                dayEntries.Count > 0));
        }
        return summaries;
    }

    private (int TotalCalories, double ComplianceRate) ComputeTotals(
        IReadOnlyList<DailyCalorieSummary> summaries)
    {
        var totalCalories = summaries.Sum(d => d.TotalCalories);
        var totalOnGoal = summaries.Sum(d => d.OnGoalCount);
        var totalConflict = summaries.Sum(d => d.ConflictCount);
        var analysed = totalOnGoal + totalConflict;
        var complianceRate = analysed == 0 ? 0.0 : (double)totalOnGoal / analysed;
        return (totalCalories, complianceRate);
    }

    private string? DetectPattern(IReadOnlyList<FoodEntry> entries, string dietStyleName)
    {
        var analysedEntries = entries.Where(e => e.AnalysisResult is not null).ToList();
        if (analysedEntries.Count < 7) return null;

        var byDow = analysedEntries
            .GroupBy(e => e.LoggedAt.DayOfWeek)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var (dow, dowEntries) in byDow)
        {
            if (dowEntries.Count < 2) continue;
            var conflicts = dowEntries.Count(e =>
            {
                var a = TryDeserializeAnalysis(e.AnalysisResult!);
                return a is not null && !a.Compatible;
            });
            if ((double)conflicts / dowEntries.Count > 0.5)
                return $"You tend to go off-{dietStyleName.ToLowerInvariant()} on {dow}s.";
        }
        return null;
    }

    private string BuildMotivatingCopy(double complianceRate, bool hasEntries)
    {
        if (!hasEntries) return "Nothing logged yet — whenever you're ready.";
        return complianceRate switch
        {
            >= 0.9 => "Great consistency — your meals are well aligned.",
            >= 0.7 => "Solid progress — most meals are on track.",
            >= 0.5 => "You're building momentum — every on-goal meal counts.",
            > 0.0 => "Keep going — consistency builds over time.",
            _ => "All logged meals had a conflict — try the suggested alternatives."
        };
    }

    private FoodAnalysisResult? TryDeserializeAnalysis(string json)
    {
        try { return JsonSerializer.Deserialize<FoodAnalysisResult>(json, JsonOptions); }
        catch { return null; }
    }
}

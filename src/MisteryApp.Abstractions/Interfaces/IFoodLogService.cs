using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Abstractions.Interfaces;

public interface IFoodLogService
{
    Task<FoodEntry> AddFoodEntryAsync(CreateFoodEntryRequest request, CancellationToken cancellationToken);
    Task DeleteFoodEntryAsync(int id, CancellationToken cancellationToken);
    Task<FoodAnalysisResult> AnalyseFoodEntryAsync(int entryId, CancellationToken cancellationToken);
    Task<IReadOnlyList<FoodEntry>> GetDailyEntriesAsync(int userId, DateOnly date, int timezoneOffsetMinutes, CancellationToken cancellationToken);
    Task<DailyLogSummary> GetDailySummaryAsync(int userId, DateOnly date, int timezoneOffsetMinutes, CancellationToken cancellationToken);
    Task<AlternativeImageResult> GetAlternativeImageForEntryAsync(int entryId, CancellationToken cancellationToken);
}

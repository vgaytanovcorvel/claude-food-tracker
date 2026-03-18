using System.Text.Json;
using System.Text.Json.Serialization;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Services;

public class FoodLogService(
    IFoodLogRepository foodLogRepository,
    IUserProfileRepository userProfileRepository,
    IFoodAnalysisService foodAnalysisService,
    IAlternativeImageService alternativeImageService,
    TimeProvider timeProvider) : IFoodLogService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public virtual async Task<FoodEntry> AddFoodEntryAsync(CreateFoodEntryRequest request, CancellationToken cancellationToken)
    {
        await userProfileRepository.UserProfileSingleByIdAsync(request.UserId, cancellationToken);
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var entry = new FoodEntry
        {
            UserId = request.UserId,
            FoodName = request.FoodName,
            EstimatedCalories = request.EstimatedCalories,
            Source = request.Source,
            LoggedAt = now
        };
        var savedEntry = await foodLogRepository.FoodEntryAddAsync(entry, cancellationToken);
        await userProfileRepository.UserProfileUpdateLastActiveAtAsync(request.UserId, now, cancellationToken);
        return savedEntry;
    }

    public virtual async Task DeleteFoodEntryAsync(int id, CancellationToken cancellationToken)
    {
        await foodLogRepository.FoodEntrySingleByIdAsync(id, cancellationToken);
        await foodLogRepository.FoodEntryDeleteAsync(id, cancellationToken);
    }

    public virtual async Task<FoodAnalysisResult> AnalyseFoodEntryAsync(int entryId, CancellationToken cancellationToken)
    {
        var entry = await foodLogRepository.FoodEntrySingleByIdAsync(entryId, cancellationToken);
        var userProfile = await userProfileRepository.UserProfileSingleByIdAsync(entry.UserId, cancellationToken);
        var result = await foodAnalysisService.AnalyseFoodAsync(entry.FoodName, userProfile.DietStyle, cancellationToken);
        var json = JsonSerializer.Serialize(result, JsonOptions);
        await foodLogRepository.FoodEntryUpdateAnalysisAsync(entryId, json, cancellationToken);
        return result;
    }

    public virtual async Task<AlternativeImageResult> GetAlternativeImageForEntryAsync(
        int entryId, CancellationToken cancellationToken)
    {
        var entry = await foodLogRepository.FoodEntrySingleByIdAsync(entryId, cancellationToken);
        if (entry.AnalysisResult is null)
            return new AlternativeImageResult(null, null);

        var analysis = JsonSerializer.Deserialize<FoodAnalysisResult>(entry.AnalysisResult, JsonOptions);
        if (analysis?.AlternativeFoodName is null or { Length: 0 })
            return new AlternativeImageResult(null, null);

        return await alternativeImageService.GenerateAlternativeImageAsync(
            analysis.AlternativeFoodName, entry.UserId, cancellationToken);
    }

    public virtual async Task<IReadOnlyList<FoodEntry>> GetDailyEntriesAsync(int userId, DateOnly date, CancellationToken cancellationToken)
    {
        return await foodLogRepository.FoodEntryGetByUserAndDateAsync(userId, date, cancellationToken);
    }

    public virtual async Task<DailyLogSummary> GetDailySummaryAsync(int userId, DateOnly date, CancellationToken cancellationToken)
    {
        var entries = await foodLogRepository.FoodEntryGetByUserAndDateAsync(userId, date, cancellationToken);
        var totalCalories = entries.Sum(e => e.EstimatedCalories);
        int onGoalCount = 0, conflictCount = 0;
        foreach (var entry in entries.Where(e => e.AnalysisResult is not null))
        {
            var result = JsonSerializer.Deserialize<FoodAnalysisResult>(entry.AnalysisResult!, JsonOptions);
            if (result is null) continue;
            if (result.Compatible) onGoalCount++;
            else conflictCount++;
        }
        var analysedCount = onGoalCount + conflictCount;
        var complianceLabel = analysedCount == 0
            ? "No meals analysed yet"
            : $"{onGoalCount} of {analysedCount} meals on goal";
        return new DailyLogSummary(date, totalCalories, onGoalCount, conflictCount, complianceLabel);
    }
}

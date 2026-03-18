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
    TimeProvider timeProvider) : IFoodLogService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public virtual async Task<FoodEntry> AddFoodEntryAsync(CreateFoodEntryRequest request, CancellationToken cancellationToken)
    {
        await userProfileRepository.UserProfileSingleByIdAsync(request.UserId, cancellationToken);

        var entry = new FoodEntry
        {
            UserId = request.UserId,
            FoodName = request.FoodName,
            EstimatedCalories = request.EstimatedCalories,
            Source = request.Source,
            LoggedAt = timeProvider.GetUtcNow().UtcDateTime
        };

        return await foodLogRepository.FoodEntryAddAsync(entry, cancellationToken);
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
}

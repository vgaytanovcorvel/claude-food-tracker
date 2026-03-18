using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Services;

public class FoodLogService(
    IFoodLogRepository foodLogRepository,
    IUserProfileRepository userProfileRepository,
    TimeProvider timeProvider) : IFoodLogService
{
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
}

using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IFoodLogRepository
{
    Task<FoodEntry> FoodEntrySingleByIdAsync(int id, CancellationToken cancellationToken);
    Task<FoodEntry?> FoodEntrySingleOrDefaultByIdAsync(int id, CancellationToken cancellationToken);
    Task<FoodEntry> FoodEntryAddAsync(FoodEntry entry, CancellationToken cancellationToken);
    Task FoodEntryDeleteAsync(int id, CancellationToken cancellationToken);
    Task FoodEntryUpdateAnalysisAsync(int id, string analysisJson, CancellationToken cancellationToken);
    Task<IReadOnlyList<FoodEntry>> FoodEntryGetByUserAndDateAsync(int userId, DateOnly date, CancellationToken cancellationToken);
}

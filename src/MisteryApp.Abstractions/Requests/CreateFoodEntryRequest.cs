using MisteryApp.Abstractions.Enums;

namespace MisteryApp.Abstractions.Requests;

public record CreateFoodEntryRequest(
    int UserId,
    string FoodName,
    int EstimatedCalories,
    FoodEntrySource Source,
    string? ImageBase64 = null);

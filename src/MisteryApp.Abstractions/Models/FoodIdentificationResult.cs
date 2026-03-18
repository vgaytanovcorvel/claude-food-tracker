namespace MisteryApp.Abstractions.Models;

public record FoodIdentificationResult(
    string FoodName,
    int EstimatedCalories,
    double ConfidenceLevel);

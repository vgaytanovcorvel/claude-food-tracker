using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IFoodAnalysisService
{
    Task<FoodAnalysisResult> AnalyseFoodAsync(
        string foodName, DietStyle dietStyle, CancellationToken cancellationToken);
}

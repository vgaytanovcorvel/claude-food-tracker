using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IVisionFoodIdentificationService
{
    Task<FoodIdentificationResult> IdentifyFoodAsync(byte[] imageBytes, int userId, CancellationToken cancellationToken);
}

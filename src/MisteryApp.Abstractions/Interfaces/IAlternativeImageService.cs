using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IAlternativeImageService
{
    Task<AlternativeImageResult> GenerateAlternativeImageAsync(string foodName, int userId, CancellationToken cancellationToken);
}

using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IFoodAnalysisPreviewService
{
    Task<AnalysisPreviewResult> AnalysePreviewAsync(
        string foodName, int userId, CancellationToken cancellationToken);
}

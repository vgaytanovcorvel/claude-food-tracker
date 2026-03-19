using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface ISuggestAlternativeService
{
    Task<AlternativeSuggestion> SuggestAsync(
        string originalFood,
        DietStyle dietStyle,
        IReadOnlyList<string> excludedNames,
        CancellationToken cancellationToken);
}

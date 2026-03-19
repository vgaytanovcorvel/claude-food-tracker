namespace MisteryApp.Abstractions.Requests;

public record SuggestAlternativeRequest(IReadOnlyList<string> ExcludedNames);

namespace MisteryApp.Abstractions.Requests;

public record SuggestAlternativeByNameRequest(
    string FoodName,
    int UserId,
    IReadOnlyList<string> ExcludedNames);

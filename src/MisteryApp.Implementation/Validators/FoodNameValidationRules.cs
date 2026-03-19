using System.Text.RegularExpressions;

namespace MisteryApp.Implementation.Validators;

internal static class FoodNameValidationRules
{
    internal static readonly HashSet<string> BlockedKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "ignore", "instructions", "system", "prompt", "inject", "override",
        "disregard", "forget", "jailbreak", "bypass"
    };

    internal static readonly Regex SafeCharactersPattern =
        new(@"^[a-zA-Z0-9 ,\-\(\)\.\/&']+$", RegexOptions.Compiled);

    internal static bool ContainsBlockedKeywords(string name)
    {
        var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return words.Any(w => BlockedKeywords.Contains(w));
    }
}

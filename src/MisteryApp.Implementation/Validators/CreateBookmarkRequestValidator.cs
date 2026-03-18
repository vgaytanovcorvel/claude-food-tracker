using System.Text.RegularExpressions;
using FluentValidation;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Validators;

public class CreateBookmarkRequestValidator : AbstractValidator<CreateBookmarkRequest>
{
    private static readonly HashSet<string> BlockedKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "ignore", "instructions", "system", "prompt", "inject", "override",
        "disregard", "forget", "jailbreak", "bypass"
    };

    private static readonly Regex SafeCharactersPattern =
        new(@"^[a-zA-Z0-9 ,\-\(\)\.\/&']+$", RegexOptions.Compiled);

    public CreateBookmarkRequestValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0);
        RuleFor(x => x.AlternativeFoodName)
            .NotEmpty()
            .MaximumLength(200)
            .Must(name => SafeCharactersPattern.IsMatch(name))
                .WithMessage("Alternative food name contains invalid characters.")
            .Must(name => !ContainsBlockedKeywords(name))
                .WithMessage("Alternative food name contains disallowed content.");
    }

    private static bool ContainsBlockedKeywords(string name)
    {
        var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return words.Any(w => BlockedKeywords.Contains(w));
    }
}

using System.Text.RegularExpressions;
using FluentValidation;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Validators;

public class AnalysePreviewRequestValidator : AbstractValidator<AnalysePreviewRequest>
{
    private static readonly HashSet<string> BlockedKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        "ignore", "instructions", "system", "prompt", "inject", "override",
        "disregard", "forget", "jailbreak", "bypass"
    };

    private static readonly Regex SafeCharactersPattern =
        new(@"^[a-zA-Z0-9 ,\-\(\)\.\/&']+$", RegexOptions.Compiled);

    public AnalysePreviewRequestValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("UserId must be a positive integer.");

        RuleFor(x => x.FoodName)
            .NotEmpty().WithMessage("Food name is required.")
            .MaximumLength(200).WithMessage("Food name must not exceed 200 characters.")
            .Must(name => SafeCharactersPattern.IsMatch(name))
                .WithMessage("Food name contains invalid characters.")
            .Must(name => !ContainsBlockedKeywords(name))
                .WithMessage("Food name contains disallowed content.");
    }

    private static bool ContainsBlockedKeywords(string name)
    {
        var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return words.Any(w => BlockedKeywords.Contains(w));
    }
}

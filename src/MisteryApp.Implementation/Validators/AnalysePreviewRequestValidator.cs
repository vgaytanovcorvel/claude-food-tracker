using FluentValidation;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Validators;

public class AnalysePreviewRequestValidator : AbstractValidator<AnalysePreviewRequest>
{
    public AnalysePreviewRequestValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("UserId must be a positive integer.");

        RuleFor(x => x.FoodName)
            .NotEmpty().WithMessage("Food name is required.")
            .MaximumLength(200).WithMessage("Food name must not exceed 200 characters.")
            .Must(name => FoodNameValidationRules.SafeCharactersPattern.IsMatch(name))
                .WithMessage("Food name contains invalid characters.")
            .Must(name => !FoodNameValidationRules.ContainsBlockedKeywords(name))
                .WithMessage("Food name contains disallowed content.");
    }
}

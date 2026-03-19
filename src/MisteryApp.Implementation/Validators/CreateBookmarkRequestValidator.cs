using FluentValidation;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Validators;

public class CreateBookmarkRequestValidator : AbstractValidator<CreateBookmarkRequest>
{
    public CreateBookmarkRequestValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0);
        RuleFor(x => x.AlternativeFoodName)
            .NotEmpty()
            .MaximumLength(200)
            .Must(name => FoodNameValidationRules.SafeCharactersPattern.IsMatch(name))
                .WithMessage("Alternative food name contains invalid characters.")
            .Must(name => !FoodNameValidationRules.ContainsBlockedKeywords(name))
                .WithMessage("Alternative food name contains disallowed content.");
    }
}

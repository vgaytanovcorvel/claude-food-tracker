using FluentValidation;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Validators;

public class CreateFoodEntryRequestValidator : AbstractValidator<CreateFoodEntryRequest>
{
    public CreateFoodEntryRequestValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("UserId must be a positive integer.");

        RuleFor(x => x.FoodName)
            .NotEmpty().WithMessage("Food name is required.")
            .MaximumLength(200).WithMessage("Food name must not exceed 200 characters.");

        RuleFor(x => x.EstimatedCalories)
            .GreaterThanOrEqualTo(0).WithMessage("Estimated calories must be non-negative.")
            .LessThanOrEqualTo(9999).WithMessage("Estimated calories must not exceed 9999.");

        RuleFor(x => x.Source)
            .IsInEnum().WithMessage("Source must be Manual or Photo.");
    }
}

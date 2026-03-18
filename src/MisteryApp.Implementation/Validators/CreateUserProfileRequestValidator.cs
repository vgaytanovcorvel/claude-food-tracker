using FluentValidation;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Validators;

public class CreateUserProfileRequestValidator : AbstractValidator<CreateUserProfileRequest>
{
    public CreateUserProfileRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DietStyle).IsInEnum();
    }
}

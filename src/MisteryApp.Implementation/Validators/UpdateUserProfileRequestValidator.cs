using FluentValidation;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Validators;

public class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
{
    public UpdateUserProfileRequestValidator()
    {
        RuleFor(x => x.DietStyle).IsInEnum();
    }
}

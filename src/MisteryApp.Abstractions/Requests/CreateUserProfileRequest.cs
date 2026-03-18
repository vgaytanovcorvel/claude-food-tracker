using MisteryApp.Abstractions.Enums;

namespace MisteryApp.Abstractions.Requests;

public record CreateUserProfileRequest(string Name, DietStyle DietStyle);

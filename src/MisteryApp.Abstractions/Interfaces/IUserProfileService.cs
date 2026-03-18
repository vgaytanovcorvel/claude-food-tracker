using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Abstractions.Interfaces;

public interface IUserProfileService
{
    Task<UserProfile?> GetUserProfileByIdAsync(int id, CancellationToken cancellationToken);
    Task<UserProfile> CreateUserProfileAsync(CreateUserProfileRequest request, CancellationToken cancellationToken);
    Task<UserProfile> UpdateUserProfileAsync(int id, UpdateUserProfileRequest request, CancellationToken cancellationToken);
    Task DeleteUserProfileAsync(int id, CancellationToken cancellationToken);
}

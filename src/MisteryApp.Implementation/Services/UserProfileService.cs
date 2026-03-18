using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Services;

public class UserProfileService(
    IUserProfileRepository userProfileRepository,
    TimeProvider timeProvider) : IUserProfileService
{
    public virtual async Task<UserProfile?> GetUserProfileByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await userProfileRepository.UserProfileSingleOrDefaultByIdAsync(id, cancellationToken);
    }

    public virtual async Task<UserProfile> CreateUserProfileAsync(CreateUserProfileRequest request, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var profile = new UserProfile
        {
            Name = request.Name,
            DietStyle = request.DietStyle,
            CreatedAt = now,
            LastActiveAt = now
        };
        return await userProfileRepository.UserProfileAddAsync(profile, cancellationToken);
    }

    public virtual async Task<UserProfile> UpdateUserProfileAsync(int id, UpdateUserProfileRequest request, CancellationToken cancellationToken)
    {
        var profile = await userProfileRepository.UserProfileSingleByIdAsync(id, cancellationToken);
        var updated = new UserProfile
        {
            Id = profile.Id,
            Name = profile.Name,
            DietStyle = request.DietStyle,
            CreatedAt = profile.CreatedAt,
            LastActiveAt = timeProvider.GetUtcNow().UtcDateTime
        };
        return await userProfileRepository.UserProfileUpdateAsync(updated, cancellationToken);
    }

    public virtual async Task DeleteUserProfileAsync(int id, CancellationToken cancellationToken)
    {
        await userProfileRepository.UserProfileSingleByIdAsync(id, cancellationToken);
        await userProfileRepository.UserProfileDeleteAsync(id, cancellationToken);
    }
}

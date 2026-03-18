using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IUserProfileRepository
{
    Task<UserProfile> UserProfileSingleByIdAsync(int id, CancellationToken cancellationToken);
    Task<UserProfile?> UserProfileSingleOrDefaultByIdAsync(int id, CancellationToken cancellationToken);
    Task<UserProfile> UserProfileAddAsync(UserProfile profile, CancellationToken cancellationToken);
    Task<UserProfile> UserProfileUpdateAsync(UserProfile profile, CancellationToken cancellationToken);
    Task UserProfileDeleteAsync(int id, CancellationToken cancellationToken);
}

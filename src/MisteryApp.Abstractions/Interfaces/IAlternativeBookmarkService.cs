using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Abstractions.Interfaces;

public interface IAlternativeBookmarkService
{
    Task<AlternativeBookmark> CreateBookmarkAsync(CreateBookmarkRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyList<AlternativeBookmark>> GetUserBookmarksAsync(int userId, CancellationToken cancellationToken);
    Task DeleteBookmarkAsync(int id, CancellationToken cancellationToken);
}

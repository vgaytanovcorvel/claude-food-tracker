using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IAlternativeBookmarkRepository
{
    Task<AlternativeBookmark> BookmarkSingleByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<AlternativeBookmark>> BookmarkGetByUserAsync(int userId, CancellationToken cancellationToken);
    Task<AlternativeBookmark> BookmarkAddAsync(AlternativeBookmark bookmark, CancellationToken cancellationToken);
    Task BookmarkDeleteAsync(int id, CancellationToken cancellationToken);
}

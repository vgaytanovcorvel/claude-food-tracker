using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Implementation.Services;

public class AlternativeBookmarkService(
    IAlternativeBookmarkRepository bookmarkRepository,
    IUserProfileRepository userProfileRepository,
    TimeProvider timeProvider) : IAlternativeBookmarkService
{
    public virtual async Task<AlternativeBookmark> CreateBookmarkAsync(
        CreateBookmarkRequest request, CancellationToken cancellationToken)
    {
        await userProfileRepository.UserProfileSingleByIdAsync(request.UserId, cancellationToken);
        var bookmark = new AlternativeBookmark
        {
            UserId = request.UserId,
            AlternativeFoodName = request.AlternativeFoodName,
            ImageBase64 = request.ImageBase64,
            MimeType = request.MimeType,
            CreatedAt = timeProvider.GetUtcNow().UtcDateTime
        };
        return await bookmarkRepository.BookmarkAddAsync(bookmark, cancellationToken);
    }

    public virtual async Task<IReadOnlyList<AlternativeBookmark>> GetUserBookmarksAsync(
        int userId, CancellationToken cancellationToken)
    {
        return await bookmarkRepository.BookmarkGetByUserAsync(userId, cancellationToken);
    }

    public virtual async Task DeleteBookmarkAsync(int id, CancellationToken cancellationToken)
    {
        await bookmarkRepository.BookmarkSingleByIdAsync(id, cancellationToken);
        await bookmarkRepository.BookmarkDeleteAsync(id, cancellationToken);
    }
}

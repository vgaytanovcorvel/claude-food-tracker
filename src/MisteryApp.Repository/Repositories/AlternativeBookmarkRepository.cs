using Microsoft.EntityFrameworkCore;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Repository.Contexts;
using MisteryApp.Repository.Entities;

namespace MisteryApp.Repository.Repositories;

public class AlternativeBookmarkRepository(IDbContextFactory<ApplicationDbContext> contextFactory)
    : RepositoryBase<ApplicationDbContext>(contextFactory), IAlternativeBookmarkRepository
{
    public virtual async Task<AlternativeBookmark> BookmarkSingleByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = await dbContext.AlternativeBookmarks
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (entity is null) throw new NotFoundException($"Bookmark not found (Id: {id}).");
        return MapToDomain(entity);
    }

    public virtual async Task<IReadOnlyList<AlternativeBookmark>> BookmarkGetByUserAsync(int userId, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entities = await dbContext.AlternativeBookmarks
            .AsNoTracking()
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(cancellationToken);
        return entities.Select(MapToDomain).ToList();
    }

    public virtual async Task<AlternativeBookmark> BookmarkAddAsync(AlternativeBookmark bookmark, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = MapToEntity(bookmark);
        var added = await dbContext.AlternativeBookmarks.AddAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapToDomain(added.Entity);
    }

    public virtual async Task BookmarkDeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var stub = new AlternativeBookmarkEntity { Id = id };
        dbContext.AlternativeBookmarks.Remove(stub);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static AlternativeBookmark MapToDomain(AlternativeBookmarkEntity entity) =>
        new()
        {
            Id = entity.Id,
            UserId = entity.UserId,
            AlternativeFoodName = entity.AlternativeFoodName,
            ImageBase64 = entity.ImageBase64,
            MimeType = entity.MimeType,
            CreatedAt = entity.CreatedAt
        };

    private static AlternativeBookmarkEntity MapToEntity(AlternativeBookmark bookmark) =>
        new()
        {
            Id = bookmark.Id,
            UserId = bookmark.UserId,
            AlternativeFoodName = bookmark.AlternativeFoodName,
            ImageBase64 = bookmark.ImageBase64,
            MimeType = bookmark.MimeType,
            CreatedAt = bookmark.CreatedAt
        };
}

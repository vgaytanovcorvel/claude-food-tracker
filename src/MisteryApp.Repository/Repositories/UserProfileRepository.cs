using Microsoft.EntityFrameworkCore;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Repository.Contexts;
using MisteryApp.Repository.Entities;

namespace MisteryApp.Repository.Repositories;

public class UserProfileRepository(IDbContextFactory<ApplicationDbContext> contextFactory)
    : RepositoryBase<ApplicationDbContext>(contextFactory), IUserProfileRepository
{
    public virtual async Task<UserProfile> UserProfileSingleByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await UserProfileSingleOrDefaultByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"User profile not found (UserId: {id}).");
    }

    public virtual async Task<UserProfile?> UserProfileSingleOrDefaultByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = await dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        return entity is null ? null : MapToDomain(entity);
    }

    public virtual async Task<UserProfile> UserProfileAddAsync(UserProfile profile, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = MapToEntity(profile);
        var entry = await dbContext.UserProfiles.AddAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapToDomain(entry.Entity);
    }

    public virtual async Task<UserProfile> UserProfileUpdateAsync(UserProfile profile, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = MapToEntity(profile);
        dbContext.UserProfiles.Update(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapToDomain(entity);
    }

    public virtual async Task UserProfileDeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var stub = new UserProfileEntity { Id = id };
        dbContext.UserProfiles.Remove(stub);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task UserProfileUpdateLastActiveAtAsync(int id, DateTime lastActiveAt, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException($"User profile not found (UserId: {id}).");
        entity.LastActiveAt = lastActiveAt;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static UserProfile MapToDomain(UserProfileEntity entity) =>
        new()
        {
            Id = entity.Id,
            Name = entity.Name,
            DietStyle = Enum.Parse<DietStyle>(entity.DietStyle),
            CreatedAt = entity.CreatedAt,
            LastActiveAt = entity.LastActiveAt
        };

    private static UserProfileEntity MapToEntity(UserProfile profile) =>
        new()
        {
            Id = profile.Id,
            Name = profile.Name,
            DietStyle = profile.DietStyle.ToString(),
            CreatedAt = profile.CreatedAt,
            LastActiveAt = profile.LastActiveAt
        };
}

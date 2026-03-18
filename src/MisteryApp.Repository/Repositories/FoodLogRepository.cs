using Microsoft.EntityFrameworkCore;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Repository.Contexts;
using MisteryApp.Repository.Entities;

namespace MisteryApp.Repository.Repositories;

public class FoodLogRepository(IDbContextFactory<ApplicationDbContext> contextFactory)
    : RepositoryBase<ApplicationDbContext>(contextFactory), IFoodLogRepository
{
    public virtual async Task<FoodEntry> FoodEntrySingleByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await FoodEntrySingleOrDefaultByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Food entry not found (EntryId: {id}).");
    }

    public virtual async Task<FoodEntry?> FoodEntrySingleOrDefaultByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = await dbContext.FoodLog
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        return entity is null ? null : MapToDomain(entity);
    }

    public virtual async Task<FoodEntry> FoodEntryAddAsync(FoodEntry entry, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = MapToEntity(entry);
        var added = await dbContext.FoodLog.AddAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapToDomain(added.Entity);
    }

    public virtual async Task FoodEntryDeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var stub = new FoodLogEntity { Id = id };
        dbContext.FoodLog.Remove(stub);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task FoodEntryUpdateAnalysisAsync(int id, string analysisJson, CancellationToken cancellationToken)
    {
        await using var dbContext = await CreateContextAsync(cancellationToken);
        var entity = await dbContext.FoodLog
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Food entry not found (EntryId: {id}).");
        entity.AnalysisResult = analysisJson;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static FoodEntry MapToDomain(FoodLogEntity entity) =>
        new()
        {
            Id = entity.Id,
            UserId = entity.UserId,
            FoodName = entity.FoodName,
            EstimatedCalories = entity.EstimatedCalories,
            LoggedAt = entity.LoggedAt,
            Source = Enum.Parse<FoodEntrySource>(entity.Source),
            AnalysisResult = entity.AnalysisResult
        };

    private static FoodLogEntity MapToEntity(FoodEntry entry) =>
        new()
        {
            Id = entry.Id,
            UserId = entry.UserId,
            FoodName = entry.FoodName,
            EstimatedCalories = entry.EstimatedCalories,
            LoggedAt = entry.LoggedAt,
            Source = entry.Source.ToString(),
            AnalysisResult = entry.AnalysisResult
        };
}

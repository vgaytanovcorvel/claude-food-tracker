using Microsoft.EntityFrameworkCore;
using MisteryApp.Repository.Entities;


namespace MisteryApp.Repository.Contexts;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{
    public DbSet<UserProfileEntity> UserProfiles => Set<UserProfileEntity>();
    public DbSet<FoodLogEntity> FoodLog => Set<FoodLogEntity>();
    public DbSet<AlternativeBookmarkEntity> AlternativeBookmarks => Set<AlternativeBookmarkEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}

using Microsoft.EntityFrameworkCore;
using MisteryApp.Repository.Contexts;

namespace MisteryApp.Repository.Tests.Repositories;

public class TestDbContextFactory(DbContextOptions<ApplicationDbContext> options)
    : IDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext() => new(options);
    public Task<ApplicationDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(new ApplicationDbContext(options));
}

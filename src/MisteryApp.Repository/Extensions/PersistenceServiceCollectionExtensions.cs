using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MisteryApp.Repository.Contexts;

namespace Microsoft.Extensions.DependencyInjection;

public static class PersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContextFactory<ApplicationDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }
}

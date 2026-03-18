using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Repository.Contexts;
using MisteryApp.Repository.Repositories;

namespace Microsoft.Extensions.DependencyInjection;

public static class PersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContextFactory<ApplicationDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserProfileRepository, UserProfileRepository>();

        return services;
    }
}

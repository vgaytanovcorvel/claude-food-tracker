using FluentValidation;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Implementation.Options;
using MisteryApp.Implementation.Services;


namespace Microsoft.Extensions.DependencyInjection;

public static class ImplementationServiceCollectionExtensions
{
    public static IServiceCollection AddMisteryAppServices(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddSingleton(TimeProvider.System);
        services.AddValidatorsFromAssembly(typeof(ImplementationServiceCollectionExtensions).Assembly);
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<IFoodLogService, FoodLogService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IAlternativeBookmarkService, AlternativeBookmarkService>();
        services.AddOptions<VisionOptions>().BindConfiguration(VisionOptions.Section);
        services.AddScoped<IVisionFoodIdentificationService, VertexAIVisionFoodIdentificationService>();
        services.AddOptions<GeminiOptions>().BindConfiguration(GeminiOptions.Section);
        services.AddScoped<IFoodAnalysisService, VertexAIGeminiFoodAnalysisService>();
        services.AddOptions<ImagenOptions>().BindConfiguration(ImagenOptions.Section);
        services.AddHttpClient<IAlternativeImageService, GeminiImagenService>(
            client => client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/"));

        return services;
    }
}

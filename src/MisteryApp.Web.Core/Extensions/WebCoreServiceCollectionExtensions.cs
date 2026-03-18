using FluentValidation.AspNetCore;

namespace Microsoft.Extensions.DependencyInjection;

public static class WebCoreServiceCollectionExtensions
{
    public static IServiceCollection AddWebCore(this IServiceCollection services)
    {
        services.AddControllers();
        services.AddFluentValidationAutoValidation();

        return services;
    }
}

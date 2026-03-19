using System.Net;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using MisteryApp.Abstractions.Models;

namespace Microsoft.Extensions.DependencyInjection;

public static class WebCoreServiceCollectionExtensions
{
    public static IServiceCollection AddWebCore(this IServiceCollection services)
    {
        services.AddControllers()
            .ConfigureApiBehaviorOptions(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState
                        .Where(e => e.Value?.Errors.Count > 0)
                        .SelectMany(e => e.Value!.Errors.Select(x => x.ErrorMessage))
                        .ToList();

                    var message = string.Join(" ", errors);
                    var response = ApiResponse<object>.Fail(message, HttpStatusCode.BadRequest);
                    return new BadRequestObjectResult(response);
                };
            });

        services.AddFluentValidationAutoValidation();

        return services;
    }
}

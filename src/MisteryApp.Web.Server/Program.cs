using Microsoft.AspNetCore.Diagnostics;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Models;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMisteryAppServices();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddWebCore();

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = exceptionFeature?.Error;

        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exception, "Unhandled exception.");

        var statusCode = exception switch
        {
            NotFoundException => StatusCodes.Status404NotFound,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var message = statusCode == StatusCodes.Status500InternalServerError
            ? "Internal server error"
            : exception?.Message ?? "An error occurred";

        await context.Response.WriteAsJsonAsync(
            ApiResponse<object>.Fail(message, (HttpStatusCode)statusCode));
    });
});

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;

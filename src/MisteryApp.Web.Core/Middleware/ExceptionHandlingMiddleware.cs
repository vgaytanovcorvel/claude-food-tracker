using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MisteryApp.Abstractions.Exceptions;
using MisteryApp.Abstractions.Models;

namespace MisteryApp.Web.Core.Middleware;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger,
    IWebHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleAsync(context, exception);
        }
    }

    private Task HandleAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            NotFoundException ex => (HttpStatusCode.NotFound, ex.Message),
            UnauthorizedAccessException ex => (HttpStatusCode.Unauthorized, ex.Message),
            _ => (HttpStatusCode.InternalServerError, GetInternalErrorMessage(exception))
        };

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        return context.Response.WriteAsJsonAsync(
            ApiResponse<object>.Fail(message, statusCode));
    }

    private string GetInternalErrorMessage(Exception exception) =>
        env.IsDevelopment()
            ? $"{exception.Message}\n\n{exception.StackTrace}"
            : "Internal server error";
}

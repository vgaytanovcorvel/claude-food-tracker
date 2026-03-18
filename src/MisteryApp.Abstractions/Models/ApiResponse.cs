using System.Net;

namespace MisteryApp.Abstractions.Models;

public record ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }
    public HttpStatusCode StatusCode { get; init; }

    public static ApiResponse<T> Ok(T data) =>
        new() { Success = true, Data = data, StatusCode = HttpStatusCode.OK };

    public static ApiResponse<T> Fail(string error, HttpStatusCode statusCode) =>
        new() { Success = false, Error = error, StatusCode = statusCode };
}

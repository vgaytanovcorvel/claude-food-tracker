namespace MisteryApp.Abstractions.Requests;

public record CreateBookmarkRequest(
    int UserId,
    string AlternativeFoodName,
    string? ImageBase64,
    string? MimeType);

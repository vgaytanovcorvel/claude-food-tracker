namespace MisteryApp.Abstractions.Models;

public record AlternativeBookmark
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public string AlternativeFoodName { get; init; } = string.Empty;
    public string? ImageBase64 { get; init; }
    public string? MimeType { get; init; }
    public DateTime CreatedAt { get; init; }
}

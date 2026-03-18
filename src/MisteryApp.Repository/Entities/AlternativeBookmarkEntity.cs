namespace MisteryApp.Repository.Entities;

public class AlternativeBookmarkEntity
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string AlternativeFoodName { get; set; } = string.Empty;
    public string? ImageBase64 { get; set; }
    public string? MimeType { get; set; }
    public DateTime CreatedAt { get; set; }

    public UserProfileEntity UserProfile { get; set; } = null!;
}

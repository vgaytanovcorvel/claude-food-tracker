namespace MisteryApp.Repository.Entities;

public class UserProfileEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DietStyle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActiveAt { get; set; }
}

using MisteryApp.Abstractions.Enums;

namespace MisteryApp.Abstractions.Models;

public class UserProfile
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DietStyle DietStyle { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActiveAt { get; set; }
}

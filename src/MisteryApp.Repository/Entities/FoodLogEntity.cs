namespace MisteryApp.Repository.Entities;

public class FoodLogEntity
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public int EstimatedCalories { get; set; }
    public DateTime LoggedAt { get; set; }
    public string Source { get; set; } = string.Empty;
    public string? AnalysisResult { get; set; }

    public UserProfileEntity UserProfile { get; set; } = null!;
}

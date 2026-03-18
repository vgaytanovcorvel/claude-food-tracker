using MisteryApp.Abstractions.Enums;

namespace MisteryApp.Abstractions.Models;

public class FoodEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public int EstimatedCalories { get; set; }
    public DateTime LoggedAt { get; set; }
    public FoodEntrySource Source { get; set; }
    public string? AnalysisResult { get; set; }
}

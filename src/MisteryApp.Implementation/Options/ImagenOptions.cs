namespace MisteryApp.Implementation.Options;

public class ImagenOptions
{
    public const string Section = "Imagen";
    public string Model { get; set; } = "imagen-3.0-generate-002";
    public int TimeoutSeconds { get; set; } = 10;
    public int DailyBudgetPerUser { get; set; } = 10;
    public string ProjectId { get; set; } = string.Empty;
    public string Location { get; set; } = "us-central1";
    public string ServiceAccountPath { get; set; } = string.Empty;
}

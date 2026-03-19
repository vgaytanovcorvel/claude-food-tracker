namespace MisteryApp.Implementation.Options;

public class GeminiOptions
{
    public const string Section = "Gemini";
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-2.0-flash";
    public int TimeoutSeconds { get; set; } = 30;
    public string ProjectId { get; set; } = string.Empty;
    public string Location { get; set; } = "us-central1";
    public string ServiceAccountPath { get; set; } = string.Empty;
}

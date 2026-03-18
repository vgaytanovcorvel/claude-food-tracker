namespace MisteryApp.Implementation.Options;

public class ImagenOptions
{
    public const string Section = "Imagen";
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "imagen-3.0-generate-002";
    public int TimeoutSeconds { get; set; } = 10;
    public int DailyBudgetPerUser { get; set; } = 10;
}

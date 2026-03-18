namespace MisteryApp.Implementation.Options;

public class VisionOptions
{
    public const string Section = "Vision";
    public string ApiKey { get; set; } = string.Empty;
    public int DailyBudgetPerUser { get; set; } = 20;
    public int TimeoutSeconds { get; set; } = 8;
}

#pragma warning disable SKEXP0070

using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Options;

namespace MisteryApp.Implementation.Services;

public class VertexAIGeminiFoodAnalysisService : IFoodAnalysisService
{
    private static readonly FoodAnalysisResult GracefulFallback =
        new(true, AnalysisSeverity.None, string.Empty, null);

    private static readonly Regex JsonExtractRegex =
        new(@"\{[\s\S]*?\}", RegexOptions.Compiled);

    private readonly GeminiOptions _opts;
    private readonly Kernel _kernel;

    public VertexAIGeminiFoodAnalysisService(IOptions<GeminiOptions> options)
    {
        _opts = options.Value;
        _kernel = BuildKernel(_opts);
    }

    private static Kernel BuildKernel(GeminiOptions opts)
    {
        var builder = Kernel.CreateBuilder();
        builder.AddVertexAIGeminiChatCompletion(
            modelId: opts.Model,
            bearerTokenProvider: () => GetAccessTokenAsync(opts.ServiceAccountPath),
            location: opts.Location,
            projectId: opts.ProjectId);
        return builder.Build();
    }

    private static async ValueTask<string> GetAccessTokenAsync(string serviceAccountPath)
    {
        var credential = GoogleCredential
            .FromFile(serviceAccountPath)
            .CreateScoped("https://www.googleapis.com/auth/cloud-platform");
        return await credential.UnderlyingCredential.GetAccessTokenForRequestAsync();
    }

    public virtual async Task<FoodAnalysisResult> AnalyseFoodAsync(
        string foodName, DietStyle dietStyle, CancellationToken cancellationToken)
    {
        var prompt = BuildPrompt(foodName, dietStyle);
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(_opts.TimeoutSeconds));

            var result = await _kernel.InvokePromptAsync(prompt, cancellationToken: cts.Token);
            return ParseAnalysisResponse(result.ToString());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return GracefulFallback;
        }
    }

    private static string BuildPrompt(string foodName, DietStyle dietStyle)
    {
        var dietGuide = dietStyle switch
        {
            DietStyle.Keto =>
                "Keto: restrict to <20g net carbs/day; avoid grains, sugar, starchy veg, rice, noodles, bread, most fruit.",
            DietStyle.LowFat =>
                "Low-fat: <30% calories from fat; avoid fried foods, fatty meats, full-fat dairy, processed snacks.",
            DietStyle.Mediterranean =>
                "Mediterranean: emphasise fish, olive oil, legumes, vegetables; limit red meat, processed food, fast food.",
            _ => throw new ArgumentOutOfRangeException(nameof(dietStyle), dietStyle, null)
        };

        return $$"""
                You are a concise dietary assistant. Evaluate whether "{{foodName}}" conflicts with the {{dietStyle}} diet.
                {{dietGuide}}
                Respond ONLY with a valid JSON object, no markdown fences, no explanation:
                {"compatible": true or false, "severity": "None"|"Low"|"Medium"|"High", "educationText": "1-2 sentence nutritional note, no medical claims.", "alternativeFoodName": "specific food or null"}
                Rules: compatible=true must have severity="None" and alternativeFoodName=null. compatible=false must have severity Low/Medium/High and a specific alternativeFoodName.
                """;
    }

    private static FoodAnalysisResult ParseAnalysisResponse(string text)
    {
        var match = JsonExtractRegex.Match(text);
        if (!match.Success) return GracefulFallback;

        try
        {
            var parsed = JsonSerializer.Deserialize<AnalysisResponse>(match.Value);
            if (parsed is null) return GracefulFallback;

            var severity = Enum.TryParse<AnalysisSeverity>(parsed.Severity, ignoreCase: true, out var s)
                ? s : AnalysisSeverity.None;

            return new FoodAnalysisResult(
                parsed.Compatible,
                severity,
                parsed.EducationText ?? string.Empty,
                parsed.AlternativeFoodName);
        }
        catch
        {
            return GracefulFallback;
        }
    }

    private sealed class AnalysisResponse
    {
        [JsonPropertyName("compatible")] public bool Compatible { get; set; }
        [JsonPropertyName("severity")] public string? Severity { get; set; }
        [JsonPropertyName("educationText")] public string? EducationText { get; set; }
        [JsonPropertyName("alternativeFoodName")] public string? AlternativeFoodName { get; set; }
    }
}

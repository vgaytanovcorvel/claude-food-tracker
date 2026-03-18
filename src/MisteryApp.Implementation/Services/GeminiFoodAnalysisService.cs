using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Options;

namespace MisteryApp.Implementation.Services;

public class GeminiFoodAnalysisService(
    HttpClient httpClient,
    IOptions<GeminiOptions> options) : IFoodAnalysisService
{
    private static readonly FoodAnalysisResult GracefulFallback =
        new(true, AnalysisSeverity.None, string.Empty, null);

    private static readonly Regex JsonExtractRegex =
        new(@"\{[\s\S]*?\}", RegexOptions.Compiled);

    public virtual async Task<FoodAnalysisResult> AnalyseFoodAsync(
        string foodName, DietStyle dietStyle, CancellationToken cancellationToken)
    {
        var prompt = BuildPrompt(foodName, dietStyle);
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(options.Value.TimeoutSeconds));

            var requestBody = new
            {
                contents = new[]
                {
                    new { role = "user", parts = new[] { new { text = prompt } } }
                }
            };

            var response = await httpClient.PostAsJsonAsync(
                $"v1beta/models/{options.Value.Model}:generateContent?key={options.Value.ApiKey}",
                requestBody,
                cts.Token);

            response.EnsureSuccessStatusCode();

            var geminiResponse = await response.Content
                .ReadFromJsonAsync<GeminiApiResponse>(cancellationToken: cts.Token);

            var text = geminiResponse?.Candidates?.FirstOrDefault()
                           ?.Content?.Parts?.FirstOrDefault()?.Text
                       ?? string.Empty;

            return ParseAnalysisResponse(text);
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
            var parsed = JsonSerializer.Deserialize<GeminiAnalysisResponse>(match.Value);
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

    private sealed class GeminiApiResponse
    {
        [JsonPropertyName("candidates")]
        public GeminiCandidate[]? Candidates { get; set; }
    }

    private sealed class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }

    private sealed class GeminiContent
    {
        [JsonPropertyName("parts")]
        public GeminiPart[]? Parts { get; set; }
    }

    private sealed class GeminiPart
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    private sealed class GeminiAnalysisResponse
    {
        [JsonPropertyName("compatible")]
        public bool Compatible { get; set; }

        [JsonPropertyName("severity")]
        public string? Severity { get; set; }

        [JsonPropertyName("educationText")]
        public string? EducationText { get; set; }

        [JsonPropertyName("alternativeFoodName")]
        public string? AlternativeFoodName { get; set; }
    }
}

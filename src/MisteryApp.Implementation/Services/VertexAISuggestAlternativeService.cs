#pragma warning disable SKEXP0070

using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.Google;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Options;

namespace MisteryApp.Implementation.Services;

public class VertexAISuggestAlternativeService(
    IOptions<GeminiOptions> options,
    ILogger<VertexAISuggestAlternativeService> logger) : ISuggestAlternativeService
{
    private static readonly AlternativeSuggestion EmptyResult = new(string.Empty);

    private static readonly Regex JsonExtractRegex =
        new(@"\{[\s\S]*?\}", RegexOptions.Compiled);

    public virtual async Task<AlternativeSuggestion> SuggestAsync(
        string originalFood,
        DietStyle dietStyle,
        IReadOnlyList<string> excludedNames,
        CancellationToken cancellationToken)
    {
        var prompt = BuildPrompt(originalFood, dietStyle, excludedNames);
        try
        {
            var opts = options.Value;
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(opts.TimeoutSeconds));

            var kernel = BuildKernel(opts);
            var settings = new GeminiPromptExecutionSettings { MaxTokens = 128 };
            var args = new KernelArguments(settings);
            var result = await kernel.InvokePromptAsync(prompt, args, cancellationToken: cts.Token);
            var text = result.GetValue<string>() ?? result.ToString() ?? string.Empty;
            return ParseResponse(text);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning("Suggest alternative failed, returning empty result (Food: {Food}, DietStyle: {DietStyle}).", originalFood, dietStyle);
            logger.LogDebug(ex, "Suggest alternative exception detail.");
            return EmptyResult;
        }
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

    private static AlternativeSuggestion ParseResponse(string text)
    {
        var match = JsonExtractRegex.Match(text);
        if (!match.Success) return EmptyResult;

        try
        {
            var parsed = JsonSerializer.Deserialize<SuggestResponse>(match.Value);
            return string.IsNullOrWhiteSpace(parsed?.FoodName)
                ? EmptyResult
                : new AlternativeSuggestion(parsed.FoodName.Trim());
        }
        catch
        {
            return EmptyResult;
        }
    }

    private static string BuildPrompt(string originalFood, DietStyle dietStyle, IReadOnlyList<string> excludedNames)
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

        var exclusion = excludedNames.Count > 0
            ? $"\nDo NOT suggest any of these already-shown alternatives: {string.Join(", ", excludedNames)}."
            : string.Empty;

        return $$"""
            You are a dietary assistant. The user logged "{{originalFood}}" which conflicts with the {{dietStyle}} diet.
            {{dietGuide}}{{exclusion}}
            Suggest ONE specific, practical, appetising alternative food that is fully compatible with this diet.
            Respond ONLY with a valid JSON object, no markdown fences, no explanation:
            {"foodName": "specific food name"}
            """;
    }

    private sealed class SuggestResponse
    {
        [JsonPropertyName("foodName")] public string? FoodName { get; set; }
    }
}

#pragma warning disable SKEXP0070

using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.Google;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Options;

namespace MisteryApp.Implementation.Services;

public class VertexAISuggestAlternativeService : ISuggestAlternativeService
{
    private static readonly AlternativeSuggestion EmptyResult = new(string.Empty);

    private readonly GeminiOptions _opts;
    private readonly Kernel _kernel;

    public VertexAISuggestAlternativeService(IOptions<GeminiOptions> options)
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

    public virtual async Task<AlternativeSuggestion> SuggestAsync(
        string originalFood,
        DietStyle dietStyle,
        IReadOnlyList<string> excludedNames,
        CancellationToken cancellationToken)
    {
        var prompt = BuildPrompt(originalFood, dietStyle, excludedNames);
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(_opts.TimeoutSeconds));

            var settings = new GeminiPromptExecutionSettings { MaxTokens = 64 };
            var args = new KernelArguments(settings);
            var result = await _kernel.InvokePromptAsync(prompt, args, cancellationToken: cts.Token);
            var text = (result.GetValue<string>() ?? result.ToString() ?? string.Empty).Trim().Trim('"');

            return string.IsNullOrWhiteSpace(text) ? EmptyResult : new AlternativeSuggestion(text);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
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
                "Keto diet (under 20g net carbs/day — no grains, sugar, starchy vegetables, bread, most fruit)",
            DietStyle.LowFat =>
                "Low-fat diet (under 30% calories from fat — no fried foods, fatty meats, full-fat dairy)",
            DietStyle.Mediterranean =>
                "Mediterranean diet (emphasise fish, olive oil, legumes, vegetables — limit red meat and processed food)",
            _ => throw new ArgumentOutOfRangeException(nameof(dietStyle), dietStyle, null)
        };

        var exclusion = excludedNames.Count > 0
            ? $"\nDo NOT suggest any of these already-shown alternatives: {string.Join(", ", excludedNames)}."
            : string.Empty;

        return $"""
            You are a dietary assistant. The user logged "{originalFood}" which conflicts with the {dietStyle} diet ({dietGuide}).
            Suggest ONE specific, practical, appetising alternative food that is fully compatible with this diet.{exclusion}
            Respond with ONLY the food name — nothing else, no explanation, no JSON, no punctuation. Just the name, e.g. Zucchini Noodles.
            """;
    }
}

#pragma warning disable SKEXP0070

using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.Google;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Options;

namespace MisteryApp.Implementation.Services;

public class VertexAIVisionFoodIdentificationService(
    IMemoryCache cache,
    IOptions<GeminiOptions> geminiOptions,
    IOptions<VisionOptions> visionOptions,
    TimeProvider timeProvider) : IVisionFoodIdentificationService
{
    private static readonly Regex JsonExtractRegex =
        new(@"\{[\s\S]*?\}", RegexOptions.Compiled);

    private static readonly string Prompt = """
        Identify the food in this image.
        Respond ONLY with a valid JSON object, no markdown fences, no explanation:
        {"foodName": "specific food name", "estimatedCalories": number per serving, "confidenceLevel": 0.0 to 1.0}
        If the image does not contain food, respond: {"foodName": "", "estimatedCalories": 0, "confidenceLevel": 0}
        """;

    private readonly GeminiOptions _gemini = geminiOptions.Value;
    private readonly VisionOptions _vision = visionOptions.Value;
    private readonly Kernel _kernel = BuildKernel(geminiOptions.Value);

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

    public virtual async Task<FoodIdentificationResult> IdentifyFoodAsync(
        byte[] imageBytes, int userId, CancellationToken cancellationToken)
    {
        var hashKey = $"vision:cache:{Convert.ToHexString(SHA256.HashData(imageBytes))}";
        if (cache.TryGetValue(hashKey, out FoodIdentificationResult? cached))
            return cached!;

        var today = timeProvider.GetUtcNow().UtcDateTime.ToString("yyyy-MM-dd");
        var budgetKey = $"vision:budget:{userId}:{today}";
        var callCount = cache.GetOrCreate(budgetKey, e =>
        {
            e.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1);
            return 0;
        });

        if (callCount >= _vision.DailyBudgetPerUser)
            return new FoodIdentificationResult(string.Empty, 0, 0);

        FoodIdentificationResult callResult;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(_gemini.TimeoutSeconds));

            var chatService = _kernel.GetRequiredService<IChatCompletionService>();
            var chatHistory = new ChatHistory();
            chatHistory.AddUserMessage(
            [
                new ImageContent(imageBytes, "image/jpeg"),
                new TextContent(Prompt)
            ]);

            var settings = new GeminiPromptExecutionSettings { MaxTokens = 128 };
            var response = await chatService.GetChatMessageContentsAsync(
                chatHistory, settings, _kernel, cts.Token);

            var text = response.FirstOrDefault()?.Content ?? string.Empty;
            callResult = ParseResponse(text);

            if (!string.IsNullOrEmpty(callResult.FoodName))
                cache.Set(hashKey, callResult, TimeSpan.FromHours(24));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            callResult = new FoodIdentificationResult(string.Empty, 0, 0);
        }

        cache.Set(budgetKey, callCount + 1, TimeSpan.FromDays(1));
        return callResult;
    }

    private static FoodIdentificationResult ParseResponse(string text)
    {
        var match = JsonExtractRegex.Match(text);
        if (!match.Success) return new FoodIdentificationResult(string.Empty, 0, 0);

        try
        {
            var parsed = JsonSerializer.Deserialize<VisionResponse>(match.Value);
            if (parsed is null || string.IsNullOrWhiteSpace(parsed.FoodName))
                return new FoodIdentificationResult(string.Empty, 0, 0);

            return new FoodIdentificationResult(
                ToTitleCase(parsed.FoodName),
                parsed.EstimatedCalories,
                parsed.ConfidenceLevel);
        }
        catch
        {
            return new FoodIdentificationResult(string.Empty, 0, 0);
        }
    }

    private static string ToTitleCase(string s) =>
        string.Join(" ", s.Split(' ').Select(w =>
            w.Length > 0 ? char.ToUpperInvariant(w[0]) + w[1..].ToLowerInvariant() : w));

    private sealed class VisionResponse
    {
        [JsonPropertyName("foodName")] public string? FoodName { get; set; }
        [JsonPropertyName("estimatedCalories")] public int EstimatedCalories { get; set; }
        [JsonPropertyName("confidenceLevel")] public double ConfidenceLevel { get; set; }
    }
}

using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Options;

namespace MisteryApp.Implementation.Services;

public class GeminiImagenService(
    HttpClient httpClient,
    IMemoryCache cache,
    IOptions<ImagenOptions> options) : IAlternativeImageService
{
    private static readonly AlternativeImageResult EmptyResult = new(null, null);

    public virtual async Task<AlternativeImageResult> GenerateAlternativeImageAsync(
        string foodName, int userId, CancellationToken cancellationToken)
    {
        var cacheKey = $"imagen:cache:{foodName.ToLowerInvariant()}";
        if (cache.TryGetValue(cacheKey, out AlternativeImageResult? cached))
            return cached!;

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var budgetKey = $"imagen:budget:{userId}:{today}";
        var callCount = cache.GetOrCreate(budgetKey, e =>
        {
            e.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1);
            return 0;
        });
        if (callCount >= options.Value.DailyBudgetPerUser)
            return EmptyResult;

        AlternativeImageResult callResult;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(options.Value.TimeoutSeconds));

            var prompt = $"A photorealistic food photograph of {foodName} on a clean white surface, professional food photography, appetizing, high resolution, studio lighting";

            var requestBody = new
            {
                instances = new[] { new { prompt } },
                parameters = new { sampleCount = 1, aspectRatio = "1:1" }
            };

            var response = await httpClient.PostAsJsonAsync(
                $"v1beta/models/{options.Value.Model}:predict?key={options.Value.ApiKey}",
                requestBody,
                cts.Token);

            response.EnsureSuccessStatusCode();

            var imagenResponse = await response.Content
                .ReadFromJsonAsync<ImagenApiResponse>(cancellationToken: cts.Token);

            var prediction = imagenResponse?.Predictions?.FirstOrDefault();
            if (prediction?.BytesBase64Encoded is null or { Length: 0 })
            {
                callResult = EmptyResult;
            }
            else
            {
                callResult = new AlternativeImageResult(prediction.BytesBase64Encoded, prediction.MimeType ?? "image/png");
                cache.Set(cacheKey, callResult, TimeSpan.FromHours(24));
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            callResult = EmptyResult;
        }

        cache.Set(budgetKey, callCount + 1, TimeSpan.FromDays(1));
        return callResult;
    }

    private sealed class ImagenApiResponse
    {
        [JsonPropertyName("predictions")]
        public ImagenPrediction[]? Predictions { get; set; }
    }

    private sealed class ImagenPrediction
    {
        [JsonPropertyName("bytesBase64Encoded")]
        public string? BytesBase64Encoded { get; set; }

        [JsonPropertyName("mimeType")]
        public string? MimeType { get; set; }
    }
}

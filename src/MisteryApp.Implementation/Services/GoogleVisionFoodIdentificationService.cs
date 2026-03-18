using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Options;

namespace MisteryApp.Implementation.Services;

public class GoogleVisionFoodIdentificationService(
    HttpClient httpClient,
    IMemoryCache cache,
    IOptions<VisionOptions> options,
    TimeProvider timeProvider) : IVisionFoodIdentificationService
{
    private static readonly HashSet<string> LabelStopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "Food", "Dish", "Ingredient", "Cuisine", "Recipe", "Natural food",
        "Tableware", "Drink", "Beverage", "Meal", "Snack", "Product",
        "Still life", "Photography", "Image", "Cooking"
    };

    private static readonly Dictionary<string, int> CalorieEstimates = new(StringComparer.OrdinalIgnoreCase)
    {
        ["pizza"] = 740,
        ["pepperoni pizza"] = 800,
        ["chicken"] = 335,
        ["chicken breast"] = 300,
        ["chicken stir fry"] = 610,
        ["stir fry"] = 420,
        ["rice noodles"] = 350,
        ["noodles"] = 300,
        ["pasta"] = 380,
        ["rice"] = 250,
        ["salad"] = 120,
        ["caesar salad"] = 360,
        ["sandwich"] = 450,
        ["burger"] = 650,
        ["hamburger"] = 650,
        ["steak"] = 500,
        ["fish"] = 220,
        ["salmon"] = 280,
        ["sushi"] = 350,
        ["curry"] = 480,
        ["soup"] = 200,
        ["omelette"] = 300,
        ["eggs"] = 150,
        ["avocado toast"] = 350,
        ["avocado"] = 160,
        ["bread"] = 200,
        ["toast"] = 180,
        ["banana"] = 90,
        ["apple"] = 80,
        ["orange"] = 70,
        ["yogurt"] = 150,
        ["greek yogurt"] = 150,
        ["yoghurt"] = 150,
        ["cereal"] = 360,
        ["oatmeal"] = 150,
        ["smoothie"] = 200,
        ["coffee"] = 10,
        ["chocolate"] = 550,
        ["cake"] = 400,
        ["ice cream"] = 300,
        ["fries"] = 365,
        ["french fries"] = 365,
        ["vegetables"] = 120,
        ["broccoli"] = 55,
        ["flatbread"] = 230,
        ["hummus"] = 160,
        ["zucchini noodles"] = 90,
        ["walnuts"] = 185,
        ["cheese"] = 400,
    };

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

        if (callCount >= options.Value.DailyBudgetPerUser)
            return new FoodIdentificationResult(string.Empty, 0, 0);

        FoodIdentificationResult callResult;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(options.Value.TimeoutSeconds));

            var base64Image = Convert.ToBase64String(imageBytes);
            var requestBody = new
            {
                requests = new[]
                {
                    new
                    {
                        image = new { content = base64Image },
                        features = new[]
                        {
                            new { type = "LABEL_DETECTION", maxResults = 10 },
                            new { type = "WEB_DETECTION", maxResults = 1 }
                        }
                    }
                }
            };

            var response = await httpClient.PostAsJsonAsync(
                $"v1/images:annotate?key={options.Value.ApiKey}",
                requestBody,
                cts.Token);

            response.EnsureSuccessStatusCode();

            var visionResponse = await response.Content
                .ReadFromJsonAsync<VisionApiResponse>(cancellationToken: cts.Token);

            callResult = ParseVisionResponse(visionResponse);
            if (!string.IsNullOrEmpty(callResult.FoodName))
                cache.Set(hashKey, callResult, TimeSpan.FromHours(24));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            callResult = new FoodIdentificationResult(string.Empty, 0, 0);
        }

        cache.Set(budgetKey, callCount + 1, TimeSpan.FromDays(1));
        return callResult;
    }

    private static FoodIdentificationResult ParseVisionResponse(VisionApiResponse? response)
    {
        if (response?.Responses is not { Length: > 0 } responses)
            return new FoodIdentificationResult(string.Empty, 0, 0);

        var imageResponse = responses[0];

        var bestGuess = imageResponse.WebDetection?.BestGuessLabels?.FirstOrDefault();
        if (bestGuess?.Label is { Length: > 0 } guessLabel)
        {
            var titleCased = ToTitleCase(guessLabel);
            return new FoodIdentificationResult(titleCased, EstimateCalories(titleCased), 0.9);
        }

        var topLabel = imageResponse.LabelAnnotations?
            .Where(l => !LabelStopWords.Contains(l.Description ?? string.Empty))
            .OrderByDescending(l => l.Score)
            .FirstOrDefault();

        if (topLabel?.Description is { Length: > 0 } labelDesc)
        {
            var titleCased = ToTitleCase(labelDesc);
            return new FoodIdentificationResult(titleCased, EstimateCalories(titleCased), topLabel.Score);
        }

        return new FoodIdentificationResult(string.Empty, 0, 0);
    }

    private static int EstimateCalories(string foodName)
    {
        if (CalorieEstimates.TryGetValue(foodName, out var exact))
            return exact;

        foreach (var (key, value) in CalorieEstimates)
        {
            if (foodName.Contains(key, StringComparison.OrdinalIgnoreCase))
                return value;
        }

        return 300;
    }

    private static string ToTitleCase(string s) =>
        string.Join(" ", s.Split(' ').Select(w =>
            w.Length > 0 ? char.ToUpperInvariant(w[0]) + w[1..].ToLowerInvariant() : w));

    private sealed class VisionApiResponse
    {
        [JsonPropertyName("responses")]
        public ImageAnnotateResponse[]? Responses { get; set; }
    }

    private sealed class ImageAnnotateResponse
    {
        [JsonPropertyName("labelAnnotations")]
        public LabelAnnotation[]? LabelAnnotations { get; set; }

        [JsonPropertyName("webDetection")]
        public WebDetection? WebDetection { get; set; }
    }

    private sealed class LabelAnnotation
    {
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("score")]
        public double Score { get; set; }
    }

    private sealed class WebDetection
    {
        [JsonPropertyName("bestGuessLabels")]
        public BestGuessLabel[]? BestGuessLabels { get; set; }
    }

    private sealed class BestGuessLabel
    {
        [JsonPropertyName("label")]
        public string? Label { get; set; }
    }
}

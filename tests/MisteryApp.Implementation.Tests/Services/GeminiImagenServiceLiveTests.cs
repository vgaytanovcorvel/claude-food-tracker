using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Implementation.Options;
using MisteryApp.Implementation.Services;

namespace MisteryApp.Implementation.Tests.Services;

/// <summary>
/// Live integration tests that call real Vertex AI Imagen.
/// These tests are skipped automatically when the service account file is not present.
/// Run selectively with: dotnet test --filter "TestCategory=Live"
/// </summary>
[TestClass]
[TestCategory("Live")]
public class GeminiImagenServiceLiveTests
{
    private const string ServiceAccountPath = @"C:\vertex-ai\corvel-ml-d6e48e345e37.json";

    private IMemoryCache memoryCache = null!;

    private static IOptions<ImagenOptions> BuildOptions() =>
        Microsoft.Extensions.Options.Options.Create(new ImagenOptions
        {
            Model = "imagen-3.0-generate-002",
            TimeoutSeconds = 30,
            DailyBudgetPerUser = 10,
            ProjectId = "corvel-ml",
            Location = "us-central1",
            ServiceAccountPath = ServiceAccountPath
        });

    [TestInitialize]
    public void Setup()
    {
        if (!File.Exists(ServiceAccountPath))
            Assert.Inconclusive($"Service account file not found at {ServiceAccountPath} — skipping live test.");

        memoryCache = new MemoryCache(new MemoryCacheOptions());
    }

    [TestCleanup]
    public void Cleanup() => memoryCache.Dispose();

    private GeminiImagenService BuildService() =>
        new(new HttpClient(), memoryCache, BuildOptions(), NullLogger<GeminiImagenService>.Instance);

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnRawResponse_ForDiagnostics()
    {
        // Prints raw Vertex AI response — useful when debugging API shape changes
        var service = BuildService();
        var result = await service.GenerateAlternativeImageAsync("Zucchini Noodles", 1, CancellationToken.None);

        Console.WriteLine($"ImageBase64 length: {result.ImageBase64?.Length ?? 0}");
        Console.WriteLine($"MimeType: {result.MimeType}");
        if (result.ImageBase64 is { Length: > 0 })
            Console.WriteLine($"ImageBase64 (first 80 chars): {result.ImageBase64[..Math.Min(80, result.ImageBase64.Length)]}");

        // Not asserting — just capturing output for inspection
        result.Should().NotBeNull();
    }

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnBase64Image_WhenFoodNameIsValid()
    {
        // Arrange
        var service = BuildService();

        // Act
        var result = await service.GenerateAlternativeImageAsync("Grilled Salmon", 1, CancellationToken.None);

        // Assert
        result.ImageBase64.Should().NotBeNullOrEmpty(
            because: "Imagen should return base64-encoded image bytes for a valid food name");
        result.MimeType.Should().NotBeNullOrEmpty();
    }

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnCachedResult_WhenCalledTwice()
    {
        // Arrange
        var countingHandler = new CountingHttpMessageHandler();
        var httpClient = new HttpClient(countingHandler);
        var service = new GeminiImagenService(httpClient, memoryCache, BuildOptions(), NullLogger<GeminiImagenService>.Instance);

        // Act — first call hits Imagen, second should be served from cache
        var result1 = await service.GenerateAlternativeImageAsync("Cauliflower Rice", 2, CancellationToken.None);
        var result2 = await service.GenerateAlternativeImageAsync("Cauliflower Rice", 2, CancellationToken.None);

        // Assert
        result1.ImageBase64.Should().NotBeNullOrEmpty();
        result2.ImageBase64.Should().Be(result1.ImageBase64,
            because: "second call should return the same cached result");
        countingHandler.CallCount.Should().Be(1,
            because: "only one HTTP call should reach Imagen; the second should be served from IMemoryCache");
    }

    private sealed class CountingHttpMessageHandler : HttpClientHandler
    {
        public int CallCount { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return await base.SendAsync(request, cancellationToken);
        }
    }
}

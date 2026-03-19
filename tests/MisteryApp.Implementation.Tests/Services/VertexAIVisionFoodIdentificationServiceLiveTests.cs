#pragma warning disable SKEXP0070
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Implementation.Options;
using MisteryApp.Implementation.Services;

namespace MisteryApp.Implementation.Tests.Services;

/// <summary>
/// Live integration tests that call real Vertex AI Gemini vision.
/// Run selectively with: dotnet test --filter "TestCategory=Live"
/// </summary>
[TestClass]
[TestCategory("Live")]
public class VertexAIVisionFoodIdentificationServiceLiveTests
{
    private const string ServiceAccountPath = @"C:\vertex-ai\corvel-ml-d6e48e345e37.json";

    private static IOptions<GeminiOptions> GeminiOpts() =>
        Microsoft.Extensions.Options.Options.Create(new GeminiOptions
        {
            Model = "gemini-2.0-flash",
            ProjectId = "corvel-ml",
            Location = "us-central1",
            ServiceAccountPath = ServiceAccountPath,
            TimeoutSeconds = 30
        });

    private static IOptions<VisionOptions> VisionOpts() =>
        Microsoft.Extensions.Options.Options.Create(new VisionOptions
        {
            DailyBudgetPerUser = 20,
            TimeoutSeconds = 30
        });

    [TestInitialize]
    public void SkipIfCredentialsMissing()
    {
        if (!File.Exists(ServiceAccountPath))
            Assert.Inconclusive($"Service account file not found at {ServiceAccountPath} — skipping live test.");
    }

    private VertexAIVisionFoodIdentificationService BuildService()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        return new VertexAIVisionFoodIdentificationService(cache, GeminiOpts(), VisionOpts(), TimeProvider.System);
    }

    [TestMethod]
    public async Task IdentifyFoodAsync_ShouldReturnFoodName_WhenGivenCakeImage()
    {
        // Arrange — create a minimal valid JPEG (1x1 pixel) and replace with a test image
        // For a real test, point this at an actual food image file on disk
        var testImagePath = @"C:\vertex-ai\test-cake.jpg";
        if (!File.Exists(testImagePath))
            Assert.Inconclusive($"Test image not found at {testImagePath}");

        var service = BuildService();
        var imageBytes = await File.ReadAllBytesAsync(testImagePath);

        // Act
        var result = await service.IdentifyFoodAsync(imageBytes, 1, CancellationToken.None);

        // Assert
        Console.WriteLine($"FoodName: {result.FoodName}");
        Console.WriteLine($"EstimatedCalories: {result.EstimatedCalories}");
        Console.WriteLine($"ConfidenceLevel: {result.ConfidenceLevel}");

        result.FoodName.Should().NotBeNullOrWhiteSpace();
        result.ConfidenceLevel.Should().BeGreaterThan(0);
    }

    [TestMethod]
    public async Task IdentifyFoodAsync_ShouldReturnResult_ForAnyJpeg()
    {
        // Arrange — uses a minimal white JPEG created on the fly
        // This just validates the API connection and response format
        var jpegBytes = CreateMinimalJpeg();
        var service = BuildService();

        // Act
        var result = await service.IdentifyFoodAsync(jpegBytes, 1, CancellationToken.None);

        // Assert — result must not throw; food name may be empty for a blank image
        Console.WriteLine($"FoodName: '{result.FoodName}'");
        Console.WriteLine($"EstimatedCalories: {result.EstimatedCalories}");
        Console.WriteLine($"ConfidenceLevel: {result.ConfidenceLevel}");

        result.Should().NotBeNull();
        result.EstimatedCalories.Should().BeGreaterThanOrEqualTo(0);
    }

    // Minimal valid JPEG bytes (1x1 white pixel)
    private static byte[] CreateMinimalJpeg() =>
    [
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
        0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD3,
        0xFF, 0xD9
    ];
}

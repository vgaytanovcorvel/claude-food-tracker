using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MisteryApp.Implementation.Services;
using System.Net;
using System.Text;
using VisionOptions = MisteryApp.Implementation.Options.VisionOptions;

namespace MisteryApp.Implementation.Tests.Services;

[TestClass]
public class GoogleVisionFoodIdentificationServiceTests
{
    private MemoryCache cache = null!;
    private FakeTimeProvider timeProvider = null!;
    private IOptions<VisionOptions> options = null!;
    private static readonly byte[] TestImageBytes = Encoding.UTF8.GetBytes("fake-image-bytes");

    [TestInitialize]
    public void Setup()
    {
        cache = new MemoryCache(new MemoryCacheOptions());
        timeProvider = new FakeTimeProvider();
        timeProvider.SetUtcNow(new DateTimeOffset(2026, 3, 18, 12, 0, 0, TimeSpan.Zero));
        options = Microsoft.Extensions.Options.Options.Create(new VisionOptions
        {
            ApiKey = "test-api-key",
            DailyBudgetPerUser = 3,
            TimeoutSeconds = 5
        });
    }

    [TestCleanup]
    public void Cleanup() => cache.Dispose();

    private static HttpClient CreateHttpClient(HttpStatusCode statusCode, string responseJson)
    {
        var handler = new FakeHttpMessageHandler(statusCode, responseJson);
        return new HttpClient(handler) { BaseAddress = new Uri("https://vision.googleapis.com/") };
    }

    [TestMethod]
    public async Task IdentifyFoodAsync_ShouldReturnFoodIdentificationResult_WhenVisionApiResponds()
    {
        // Arrange
        const string visionJson = """
            {
              "responses": [{
                "webDetection": {
                  "bestGuessLabels": [{"label": "chicken stir fry"}]
                }
              }]
            }
            """;

        var httpClient = CreateHttpClient(HttpStatusCode.OK, visionJson);
        var serviceMock = new Mock<GoogleVisionFoodIdentificationService>(
            () => new GoogleVisionFoodIdentificationService(httpClient, cache, options, timeProvider),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None);

        // Assert
        result.FoodName.Should().Be("Chicken Stir Fry");
        result.EstimatedCalories.Should().Be(610);
        result.ConfidenceLevel.Should().Be(0.9);
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task IdentifyFoodAsync_ShouldReturnCachedResult_WhenCalledTwiceWithSameImage()
    {
        // Arrange
        var callCount = 0;
        const string visionJson = """
            {
              "responses": [{
                "webDetection": {
                  "bestGuessLabels": [{"label": "salad"}]
                }
              }]
            }
            """;

        var handler = new CountingFakeHttpMessageHandler(HttpStatusCode.OK, visionJson, () => callCount++);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://vision.googleapis.com/") };
        var service = new GoogleVisionFoodIdentificationService(httpClient, cache, options, timeProvider);

        // Act
        var first = await service.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None);
        var second = await service.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None);

        // Assert
        callCount.Should().Be(1);
        second.FoodName.Should().Be(first.FoodName);
        second.EstimatedCalories.Should().Be(first.EstimatedCalories);
    }

    [TestMethod]
    public async Task IdentifyFoodAsync_ShouldReturnEmptyResult_WhenBudgetExceeded()
    {
        // Arrange — pre-fill budget to max
        var today = timeProvider.GetUtcNow().UtcDateTime.ToString("yyyy-MM-dd");
        cache.Set($"vision:budget:1:{today}", 3, TimeSpan.FromDays(1));

        var httpClient = CreateHttpClient(HttpStatusCode.OK, "{}");
        var serviceMock = new Mock<GoogleVisionFoodIdentificationService>(
            () => new GoogleVisionFoodIdentificationService(httpClient, cache, options, timeProvider),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None);

        // Assert
        result.FoodName.Should().BeEmpty();
        result.EstimatedCalories.Should().Be(0);
        result.ConfidenceLevel.Should().Be(0);
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task IdentifyFoodAsync_ShouldReturnEmptyResult_WhenVisionApiReturnsError()
    {
        // Arrange
        var httpClient = CreateHttpClient(HttpStatusCode.ServiceUnavailable, string.Empty);
        var serviceMock = new Mock<GoogleVisionFoodIdentificationService>(
            () => new GoogleVisionFoodIdentificationService(httpClient, cache, options, timeProvider),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None);

        // Assert
        result.FoodName.Should().BeEmpty();
        result.EstimatedCalories.Should().Be(0);
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task IdentifyFoodAsync_ShouldReturnEmptyResult_WhenVisionApiTimesOut()
    {
        // Arrange
        var slowOptions = Microsoft.Extensions.Options.Options.Create(new VisionOptions
        {
            ApiKey = "test-key",
            DailyBudgetPerUser = 10,
            TimeoutSeconds = 1
        });

        var handler = new SlowFakeHttpMessageHandler(TimeSpan.FromSeconds(10));
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://vision.googleapis.com/") };
        var serviceMock = new Mock<GoogleVisionFoodIdentificationService>(
            () => new GoogleVisionFoodIdentificationService(httpClient, cache, slowOptions, timeProvider),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.IdentifyFoodAsync(TestImageBytes, 1, CancellationToken.None);

        // Assert
        result.FoodName.Should().BeEmpty();
        serviceMock.VerifyAll();
    }

    private sealed class FakeHttpMessageHandler(HttpStatusCode statusCode, string content) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(content, Encoding.UTF8, "application/json")
            });
    }

    private sealed class CountingFakeHttpMessageHandler(
        HttpStatusCode statusCode, string content, Action onSend) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            onSend();
            return Task.FromResult(new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(content, Encoding.UTF8, "application/json")
            });
        }
    }

    private sealed class SlowFakeHttpMessageHandler(TimeSpan delay) : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            await Task.Delay(delay, cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json")
            };
        }
    }
}

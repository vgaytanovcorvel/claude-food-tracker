using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MisteryApp.Implementation.Services;
using ImagenOptions = MisteryApp.Implementation.Options.ImagenOptions;

namespace MisteryApp.Implementation.Tests.Services;

[TestClass]
public class GeminiImagenServiceTests
{
    private IOptions<ImagenOptions> options = null!;
    private IMemoryCache memoryCache = null!;

    [TestInitialize]
    public void Setup()
    {
        options = Microsoft.Extensions.Options.Options.Create(new ImagenOptions
        {
            Model = "imagen-3.0-generate-002",
            TimeoutSeconds = 5,
            ProjectId = "test-project",
            Location = "us-central1",
            ServiceAccountPath = ""
        });
        memoryCache = new MemoryCache(new MemoryCacheOptions());
    }

    [TestCleanup]
    public void Cleanup()
    {
        memoryCache.Dispose();
    }

    private static HttpClient CreateHttpClient(HttpStatusCode statusCode, string responseJson)
    {
        var handler = new FakeHttpMessageHandler(statusCode, responseJson);
        return new HttpClient(handler) { BaseAddress = new Uri("https://generativelanguage.googleapis.com/") };
    }

    private static string BuildImagenResponse(string base64, string mimeType) =>
        $$"""
        {
          "predictions": [{
            "bytesBase64Encoded": "{{base64}}",
            "mimeType": "{{mimeType}}"
          }]
        }
        """;

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnImage_WhenImagenReturnsSuccess()
    {
        // Arrange
        const string fakeBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ";
        var httpClient = CreateHttpClient(HttpStatusCode.OK, BuildImagenResponse(fakeBase64, "image/png"));
        var serviceMock = new Mock<GeminiImagenService>(
            () => new GeminiImagenService(httpClient, memoryCache, options),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.GenerateAlternativeImageAsync("Zucchini Noodles", 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.GenerateAlternativeImageAsync("Zucchini Noodles", 1, CancellationToken.None);

        // Assert
        result.ImageBase64.Should().NotBeNull();
        result.ImageBase64.Should().Be(fakeBase64);
        result.MimeType.Should().Be("image/png");
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnCachedResult_WhenCalledTwice()
    {
        // Arrange
        const string fakeBase64 = "cachedImageBase64==";
        var countingHandler = new CountingFakeHttpMessageHandler(HttpStatusCode.OK, BuildImagenResponse(fakeBase64, "image/png"));
        var httpClient = new HttpClient(countingHandler) { BaseAddress = new Uri("https://generativelanguage.googleapis.com/") };
        var serviceMock = new Mock<GeminiImagenService>(
            () => new GeminiImagenService(httpClient, memoryCache, options),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.GenerateAlternativeImageAsync("Avocado Toast", 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Exactly(2));

        // Act
        var result1 = await serviceMock.Object.GenerateAlternativeImageAsync("Avocado Toast", 1, CancellationToken.None);
        var result2 = await serviceMock.Object.GenerateAlternativeImageAsync("Avocado Toast", 1, CancellationToken.None);

        // Assert
        result1.ImageBase64.Should().Be(fakeBase64);
        result2.ImageBase64.Should().Be(fakeBase64);
        countingHandler.CallCount.Should().Be(1);
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnEmpty_WhenImagenUnavailable()
    {
        // Arrange
        var httpClient = CreateHttpClient(HttpStatusCode.ServiceUnavailable, string.Empty);
        var serviceMock = new Mock<GeminiImagenService>(
            () => new GeminiImagenService(httpClient, memoryCache, options),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.GenerateAlternativeImageAsync("Salmon", 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.GenerateAlternativeImageAsync("Salmon", 1, CancellationToken.None);

        // Assert
        result.ImageBase64.Should().BeNull();
        result.MimeType.Should().BeNull();
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnEmpty_WhenImagenTimesOut()
    {
        // Arrange
        var slowOptions = Microsoft.Extensions.Options.Options.Create(new ImagenOptions
        {
            Model = "imagen-3.0-generate-002",
            TimeoutSeconds = 1,
            ProjectId = "test-project",
            Location = "us-central1",
            ServiceAccountPath = ""
        });
        var handler = new SlowFakeHttpMessageHandler(TimeSpan.FromSeconds(10));
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://generativelanguage.googleapis.com/") };
        var serviceMock = new Mock<GeminiImagenService>(
            () => new GeminiImagenService(httpClient, memoryCache, slowOptions),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.GenerateAlternativeImageAsync("Broccoli", 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.GenerateAlternativeImageAsync("Broccoli", 1, CancellationToken.None);

        // Assert
        result.ImageBase64.Should().BeNull();
        result.MimeType.Should().BeNull();
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task GenerateAlternativeImageAsync_ShouldReturnEmpty_WhenPredictionsIsEmpty()
    {
        // Arrange
        const string emptyPredictionsJson = """{ "predictions": [] }""";
        var httpClient = CreateHttpClient(HttpStatusCode.OK, emptyPredictionsJson);
        var serviceMock = new Mock<GeminiImagenService>(
            () => new GeminiImagenService(httpClient, memoryCache, options),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.GenerateAlternativeImageAsync("Plain Rice", 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.GenerateAlternativeImageAsync("Plain Rice", 1, CancellationToken.None);

        // Assert
        result.ImageBase64.Should().BeNull();
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

    private sealed class CountingFakeHttpMessageHandler(HttpStatusCode statusCode, string content) : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
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

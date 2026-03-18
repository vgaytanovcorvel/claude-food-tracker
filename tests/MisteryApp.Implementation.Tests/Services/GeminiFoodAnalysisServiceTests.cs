using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Implementation.Services;
using GeminiOptions = MisteryApp.Implementation.Options.GeminiOptions;

namespace MisteryApp.Implementation.Tests.Services;

[TestClass]
public class GeminiFoodAnalysisServiceTests
{
    private IOptions<GeminiOptions> options = null!;

    [TestInitialize]
    public void Setup()
    {
        options = Microsoft.Extensions.Options.Options.Create(new GeminiOptions
        {
            ApiKey = "test-api-key",
            Model = "gemini-1.5-flash",
            TimeoutSeconds = 5
        });
    }

    private static HttpClient CreateHttpClient(HttpStatusCode statusCode, string responseJson)
    {
        var handler = new FakeHttpMessageHandler(statusCode, responseJson);
        return new HttpClient(handler) { BaseAddress = new Uri("https://generativelanguage.googleapis.com/") };
    }

    private static string BuildGeminiResponse(string innerJson) =>
        $$"""
        {
          "candidates": [{
            "content": {
              "parts": [{"text": {{System.Text.Json.JsonSerializer.Serialize(innerJson)}} }]
            }
          }]
        }
        """;

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnConflict_WhenKetoUserLogsRiceNoodles()
    {
        // Arrange
        const string innerJson = """{"compatible": false, "severity": "Medium", "educationText": "Rice noodles are high in net carbs, exceeding keto daily limits.", "alternativeFoodName": "Zucchini Noodles"}""";
        var httpClient = CreateHttpClient(HttpStatusCode.OK, BuildGeminiResponse(innerJson));
        var serviceMock = new Mock<GeminiFoodAnalysisService>(
            () => new GeminiFoodAnalysisService(httpClient, options),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.AnalyseFoodAsync("Rice Noodles", DietStyle.Keto, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.AnalyseFoodAsync("Rice Noodles", DietStyle.Keto, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeFalse();
        result.Severity.Should().Be(AnalysisSeverity.Medium);
        result.EducationText.Should().NotBeEmpty();
        result.AlternativeFoodName.Should().Be("Zucchini Noodles");
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnCompatible_WhenKetoUserLogsChicken()
    {
        // Arrange
        const string innerJson = """{"compatible": true, "severity": "None", "educationText": "Chicken breast is an excellent keto choice, high in protein and very low in carbs.", "alternativeFoodName": null}""";
        var httpClient = CreateHttpClient(HttpStatusCode.OK, BuildGeminiResponse(innerJson));
        var serviceMock = new Mock<GeminiFoodAnalysisService>(
            () => new GeminiFoodAnalysisService(httpClient, options),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.AnalyseFoodAsync("Chicken Breast", DietStyle.Keto, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.AnalyseFoodAsync("Chicken Breast", DietStyle.Keto, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeTrue();
        result.Severity.Should().Be(AnalysisSeverity.None);
        result.AlternativeFoodName.Should().BeNull();
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnHighSeverity_WhenMediterraneanUserLogsPizza()
    {
        // Arrange
        const string innerJson = """{"compatible": false, "severity": "High", "educationText": "Pepperoni pizza is high in saturated fat and processed meat, conflicting with Mediterranean diet principles.", "alternativeFoodName": "Flatbread with Hummus"}""";
        var httpClient = CreateHttpClient(HttpStatusCode.OK, BuildGeminiResponse(innerJson));
        var serviceMock = new Mock<GeminiFoodAnalysisService>(
            () => new GeminiFoodAnalysisService(httpClient, options),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.AnalyseFoodAsync("Pepperoni Pizza", DietStyle.Mediterranean, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.AnalyseFoodAsync("Pepperoni Pizza", DietStyle.Mediterranean, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeFalse();
        result.Severity.Should().Be(AnalysisSeverity.High);
        result.AlternativeFoodName.Should().Be("Flatbread with Hummus");
        serviceMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnFallback_WhenGeminiUnavailable()
    {
        // Arrange
        var httpClient = CreateHttpClient(HttpStatusCode.ServiceUnavailable, string.Empty);
        var service = new GeminiFoodAnalysisService(httpClient, options);

        // Act
        var result = await service.AnalyseFoodAsync("Pizza", DietStyle.Keto, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeTrue();
        result.Severity.Should().Be(AnalysisSeverity.None);
        result.EducationText.Should().BeEmpty();
        result.AlternativeFoodName.Should().BeNull();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnFallback_WhenGeminiTimesOut()
    {
        // Arrange
        var slowOptions = Microsoft.Extensions.Options.Options.Create(new GeminiOptions
        {
            ApiKey = "test-key",
            Model = "gemini-1.5-flash",
            TimeoutSeconds = 1
        });
        var handler = new SlowFakeHttpMessageHandler(TimeSpan.FromSeconds(10));
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://generativelanguage.googleapis.com/") };
        var service = new GeminiFoodAnalysisService(httpClient, slowOptions);

        // Act
        var result = await service.AnalyseFoodAsync("Pizza", DietStyle.Keto, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeTrue();
        result.Severity.Should().Be(AnalysisSeverity.None);
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

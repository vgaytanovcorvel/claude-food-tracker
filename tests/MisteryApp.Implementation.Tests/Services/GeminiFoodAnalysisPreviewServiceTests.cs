using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Implementation.Services;
using GeminiOptions = MisteryApp.Implementation.Options.GeminiOptions;

namespace MisteryApp.Implementation.Tests.Services;

[TestClass]
public class GeminiFoodAnalysisPreviewServiceTests
{
    private IOptions<GeminiOptions> options = null!;
    private Mock<IUserProfileRepository> userProfileRepositoryMock = new(MockBehavior.Strict);

    [TestInitialize]
    public void Setup()
    {
        options = Microsoft.Extensions.Options.Options.Create(new GeminiOptions
        {
            ApiKey = "test-api-key",
            Model = "gemini-1.5-flash",
            TimeoutSeconds = 5
        });
        userProfileRepositoryMock = new Mock<IUserProfileRepository>(MockBehavior.Strict);
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

    private static UserProfile MakeUser() => new() { Id = 1, Name = "Alice", DietStyle = DietStyle.Keto };

    [TestMethod]
    public async Task AnalysePreview_ShouldReturnConflictResult_WhenGeminiResponds()
    {
        // Arrange
        const string innerJson = """{"compatible": false, "severity": "High", "educationText": "Rice noodles are high in net carbs.", "alternativeFoodName": "Zucchini Noodles", "estimatedCalories": 180}""";
        var httpClient = CreateHttpClient(HttpStatusCode.OK, BuildGeminiResponse(innerJson));
        var user = MakeUser();
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(1, CancellationToken.None))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        var serviceMock = new Mock<GeminiFoodAnalysisPreviewService>(
            () => new GeminiFoodAnalysisPreviewService(httpClient, options, userProfileRepositoryMock.Object),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.AnalysePreviewAsync("Rice Noodles", 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.AnalysePreviewAsync("Rice Noodles", 1, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeFalse();
        result.Severity.Should().Be(AnalysisSeverity.High);
        result.AlternativeFoodName.Should().Be("Zucchini Noodles");
        serviceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalysePreview_ShouldReturnCalorieEstimate_WhenGeminiIncludesIt()
    {
        // Arrange
        const string innerJson = """{"compatible": true, "severity": "None", "educationText": "Chicken breast is keto-friendly.", "alternativeFoodName": null, "estimatedCalories": 165}""";
        var httpClient = CreateHttpClient(HttpStatusCode.OK, BuildGeminiResponse(innerJson));
        var user = MakeUser();
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(1, CancellationToken.None))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        var serviceMock = new Mock<GeminiFoodAnalysisPreviewService>(
            () => new GeminiFoodAnalysisPreviewService(httpClient, options, userProfileRepositoryMock.Object),
            MockBehavior.Strict);
        serviceMock
            .Setup(s => s.AnalysePreviewAsync("Chicken Breast", 1, CancellationToken.None))
            .CallBase()
            .Verifiable(Times.Once());

        // Act
        var result = await serviceMock.Object.AnalysePreviewAsync("Chicken Breast", 1, CancellationToken.None);

        // Assert
        result.EstimatedCalories.Should().Be(165);
        result.Compatible.Should().BeTrue();
        serviceMock.VerifyAll();
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalysePreview_ShouldReturnFallback_WhenGeminiFails()
    {
        // Arrange
        var httpClient = CreateHttpClient(HttpStatusCode.ServiceUnavailable, string.Empty);
        var user = MakeUser();
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(1, CancellationToken.None))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        var service = new GeminiFoodAnalysisPreviewService(httpClient, options, userProfileRepositoryMock.Object);

        // Act
        var result = await service.AnalysePreviewAsync("Pizza", 1, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeTrue();
        result.Severity.Should().Be(AnalysisSeverity.None);
        result.EstimatedCalories.Should().Be(0);
        userProfileRepositoryMock.VerifyAll();
    }

    [TestMethod]
    public async Task AnalysePreview_ShouldReturnFallback_WhenTimeout()
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
        var user = MakeUser();
        userProfileRepositoryMock
            .Setup(r => r.UserProfileSingleByIdAsync(1, CancellationToken.None))
            .ReturnsAsync(user)
            .Verifiable(Times.Once());
        var service = new GeminiFoodAnalysisPreviewService(httpClient, slowOptions, userProfileRepositoryMock.Object);

        // Act
        var result = await service.AnalysePreviewAsync("Pizza", 1, CancellationToken.None);

        // Assert
        result.Compatible.Should().BeTrue();
        result.Severity.Should().Be(AnalysisSeverity.None);
        userProfileRepositoryMock.VerifyAll();
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

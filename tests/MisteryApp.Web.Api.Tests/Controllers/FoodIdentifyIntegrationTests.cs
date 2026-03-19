using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Repository.Contexts;

namespace MisteryApp.Web.Api.Tests.Controllers;

[TestClass]
public class FoodIdentifyIntegrationTests
{
    private static readonly FoodIdentificationResult FakeResult = new("Chicken Breast", 300, 0.92);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private WebApplicationFactory<Program> factory = null!;
    private HttpClient client = null!;

    [TestInitialize]
    public void Setup()
    {
        factory = BuildFactory(FakeResult);
        client = factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        client.Dispose();
        factory.Dispose();
    }

    private static WebApplicationFactory<Program> BuildFactory(FoodIdentificationResult visionResult) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                var dbDescriptors = services
                    .Where(d => d.ServiceType == typeof(IDbContextFactory<ApplicationDbContext>)
                        || d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>)
                        || d.ServiceType == typeof(DbContextOptions)
                        || (d.ServiceType.FullName != null
                            && d.ServiceType.FullName.Contains("ApplicationDbContext")))
                    .ToList();
                foreach (var d in dbDescriptors) services.Remove(d);

                services.AddDbContextFactory<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("FoodIdentifyDb_" + Guid.NewGuid()));

                services.RemoveAll<IVisionFoodIdentificationService>();
                services.AddSingleton<IVisionFoodIdentificationService>(
                    new FakeVisionService(visionResult));
            }));

    private static MultipartFormDataContent BuildImageContent(byte[]? imageBytes = null)
    {
        var bytes = imageBytes ?? Encoding.UTF8.GetBytes("fake-image-bytes");
        var content = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent(bytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Add(imageContent, "image", "test.jpg");
        content.Add(new StringContent("1"), "userId");
        return content;
    }

    [TestMethod]
    public async Task PostIdentify_ShouldReturn200WithResult_WhenImageProvided()
    {
        // Arrange
        using var content = BuildImageContent();

        // Act
        var response = await client.PostAsync("/api/food-entries/identify", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FoodIdentificationResult>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data!.FoodName.Should().Be("Chicken Breast");
        body.Data.EstimatedCalories.Should().Be(300);
        body.Data.ConfidenceLevel.Should().Be(0.92);
    }

    [TestMethod]
    public async Task PostIdentify_ShouldReturn400_WhenNoImageProvided()
    {
        // Arrange
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent("1"), "userId");

        // Act
        var response = await client.PostAsync("/api/food-entries/identify", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [TestMethod]
    public async Task PostIdentify_ShouldReturnEmptyResult_WhenVisionServiceReturnsEmpty()
    {
        // Arrange
        using var emptyFactory = BuildFactory(new FoodIdentificationResult(string.Empty, 0, 0));
        using var emptyClient = emptyFactory.CreateClient();
        using var content = BuildImageContent();

        // Act
        var response = await emptyClient.PostAsync("/api/food-entries/identify", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FoodIdentificationResult>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data!.FoodName.Should().BeEmpty();
        body.Data.EstimatedCalories.Should().Be(0);
    }

    [TestMethod]
    public async Task PostIdentify_ShouldReturn400_WhenImageExceeds10Mb()
    {
        // Arrange — 10 MB + 1 byte
        var oversizedBytes = new byte[10 * 1024 * 1024 + 1];
        using var content = BuildImageContent(oversizedBytes);

        // Act
        var response = await client.PostAsync("/api/food-entries/identify", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FoodIdentificationResult>>(JsonOptions);
        body!.Success.Should().BeFalse();
        body.Error.Should().Contain("10 MB");
    }

    [TestMethod]
    public async Task PostIdentify_ShouldNotExposeImageBytesInResponse()
    {
        // Arrange — use recognizable unique bytes to detect any leakage
        var uniqueBytes = System.Text.Encoding.UTF8.GetBytes("UNIQUE-PHOTO-BYTES-MARKER-12345");
        using var content = BuildImageContent(uniqueBytes);

        // Act
        var response = await client.PostAsync("/api/food-entries/identify", content);
        var responseText = await response.Content.ReadAsStringAsync();

        // Assert — response must not contain raw or base64-encoded image bytes
        var base64Encoded = Convert.ToBase64String(uniqueBytes);
        responseText.Should().NotContain("UNIQUE-PHOTO-BYTES-MARKER-12345");
        responseText.Should().NotContain(base64Encoded);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private sealed class FakeVisionService(FoodIdentificationResult result) : IVisionFoodIdentificationService
    {
        public Task<FoodIdentificationResult> IdentifyFoodAsync(
            byte[] imageBytes, int userId, CancellationToken cancellationToken) =>
            Task.FromResult(result);
    }
}

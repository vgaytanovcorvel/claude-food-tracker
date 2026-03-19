using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;
using MisteryApp.Repository.Contexts;

namespace MisteryApp.Web.Api.Tests.Controllers;

[TestClass]
public class FoodAlternativeImageIntegrationTests
{
    private static readonly AlternativeImageResult FakeImage = new("ZmFrZWltYWdlYmFzZTY0", "image/png");

    private static readonly FoodAnalysisResult ConflictAnalysis = new(
        false, AnalysisSeverity.Medium,
        "Rice noodles are high in net carbs, exceeding keto daily limits.",
        "Zucchini Noodles");

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
        factory = BuildFactory(ConflictAnalysis, FakeImage);
        client = factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        client.Dispose();
        factory.Dispose();
    }

    private static WebApplicationFactory<Program> BuildFactory(
        FoodAnalysisResult analysisResult,
        AlternativeImageResult imageResult) =>
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
                    options.UseInMemoryDatabase("FoodAlternativeImageDb_" + Guid.NewGuid()));

                services.RemoveAll<IFoodAnalysisService>();
                services.AddSingleton<IFoodAnalysisService>(new FakeGeminiService(analysisResult));

                services.RemoveAll<IAlternativeImageService>();
                services.AddSingleton<IAlternativeImageService>(new FakeImagenService(imageResult));
            }));

    private async Task<(int UserId, int EntryId)> CreateUserAndEntryAsync()
    {
        var userResp = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Alice", DietStyle.Keto));
        var userBody = await userResp.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        var userId = userBody!.Data!.Id;

        var entryResp = await client.PostAsJsonAsync("/api/food-entries",
            new CreateFoodEntryRequest(userId, "Rice Noodles", 350, FoodEntrySource.Manual));
        var entryBody = await entryResp.Content.ReadFromJsonAsync<ApiResponse<FoodEntry>>(JsonOptions);
        var entryId = entryBody!.Data!.Id;

        return (userId, entryId);
    }

    [TestMethod]
    public async Task GetAlternativeImage_ShouldReturn200WithResult_WhenEntryExistsWithAnalysis()
    {
        // Arrange
        var (_, entryId) = await CreateUserAndEntryAsync();
        await client.PostAsync($"/api/food-entries/{entryId}/analyse", null);

        // Act
        var response = await client.GetAsync($"/api/food-entries/{entryId}/alternative-image");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AlternativeImageResult>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data!.ImageBase64.Should().NotBeNull();
        body.Data.ImageBase64.Should().Be("ZmFrZWltYWdlYmFzZTY0");
    }

    [TestMethod]
    public async Task GetAlternativeImage_ShouldReturn200WithEmptyResult_WhenEntryHasNoAnalysis()
    {
        // Arrange — create entry but do NOT analyse it
        var (_, entryId) = await CreateUserAndEntryAsync();

        // Act
        var response = await client.GetAsync($"/api/food-entries/{entryId}/alternative-image");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AlternativeImageResult>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data!.ImageBase64.Should().BeNull();
    }

    [TestMethod]
    public async Task GetAlternativeImage_ShouldReturn404_WhenEntryNotFound()
    {
        // Act
        var response = await client.GetAsync("/api/food-entries/99999/alternative-image");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private sealed class FakeGeminiService(FoodAnalysisResult result) : IFoodAnalysisService
    {
        public Task<FoodAnalysisResult> AnalyseFoodAsync(
            string foodName, DietStyle dietStyle, CancellationToken cancellationToken) =>
            Task.FromResult(result);
    }

    private sealed class FakeImagenService(AlternativeImageResult result) : IAlternativeImageService
    {
        public Task<AlternativeImageResult> GenerateAlternativeImageAsync(
            string foodName, int userId, CancellationToken cancellationToken) =>
            Task.FromResult(result);
    }
}

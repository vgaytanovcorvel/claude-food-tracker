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
public class FoodAnalyseIntegrationTests
{
    private static readonly FoodAnalysisResult FakeAnalysis = new(
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
        factory = BuildFactory(FakeAnalysis);
        client = factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        client.Dispose();
        factory.Dispose();
    }

    private static WebApplicationFactory<Program> BuildFactory(FoodAnalysisResult analysisResult) =>
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
                    options.UseInMemoryDatabase("FoodAnalyseDb_" + Guid.NewGuid()));

                services.RemoveAll<IFoodAnalysisService>();
                services.AddSingleton<IFoodAnalysisService>(new FakeGeminiService(analysisResult));
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
    public async Task PostAnalyse_ShouldReturn200WithResult_WhenEntryExists()
    {
        // Arrange
        var (_, entryId) = await CreateUserAndEntryAsync();

        // Act
        var response = await client.PostAsync($"/api/food-entries/{entryId}/analyse", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FoodAnalysisResult>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data!.Compatible.Should().BeFalse();
        body.Data.Severity.Should().Be(AnalysisSeverity.Medium);
        body.Data.EducationText.Should().NotBeEmpty();
        body.Data.AlternativeFoodName.Should().Be("Zucchini Noodles");
    }

    [TestMethod]
    public async Task PostAnalyse_ShouldReturn404_WhenEntryNotFound()
    {
        // Act
        var response = await client.PostAsync("/api/food-entries/99999/analyse", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private sealed class FakeGeminiService(FoodAnalysisResult result) : IFoodAnalysisService
    {
        public Task<FoodAnalysisResult> AnalyseFoodAsync(
            string foodName, DietStyle dietStyle, CancellationToken cancellationToken) =>
            Task.FromResult(result);
    }
}

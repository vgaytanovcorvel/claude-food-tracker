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
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;
using MisteryApp.Repository.Contexts;

namespace MisteryApp.Web.Api.Tests.Controllers;

[TestClass]
public class FoodPatchAnalysisIntegrationTests
{
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
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
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
                    options.UseInMemoryDatabase("FoodPatchAnalysisDb_" + Guid.NewGuid()));
            }));
        client = factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        client.Dispose();
        factory.Dispose();
    }

    private async Task<(int UserId, int EntryId)> CreateUserAndEntryAsync()
    {
        var userResp = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Alice", DietStyle.Keto));
        var userBody = await userResp.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        var userId = userBody!.Data!.Id;

        var entryResp = await client.PostAsJsonAsync("/api/food-entries",
            new CreateFoodEntryRequest(userId, "Chicken Breast", 165, FoodEntrySource.Manual));
        var entryBody = await entryResp.Content.ReadFromJsonAsync<ApiResponse<FoodEntry>>(JsonOptions);
        var entryId = entryBody!.Data!.Id;

        return (userId, entryId);
    }

    [TestMethod]
    public async Task PatchAnalysis_ShouldReturn200_WhenEntryExists()
    {
        // Arrange
        var (_, entryId) = await CreateUserAndEntryAsync();
        const string analysisJson = """{"compatible":true,"severity":"None","educationText":"Keto-friendly.","alternativeFoodName":null,"estimatedCalories":165}""";
        var request = new PatchFoodEntryAnalysisRequest(analysisJson);

        // Act
        var response = await client.PatchAsJsonAsync($"/api/food-entries/{entryId}/analysis", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<bool>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data.Should().BeTrue();
    }

    [TestMethod]
    public async Task PatchAnalysis_ShouldReturn404_WhenEntryMissing()
    {
        // Arrange
        var request = new PatchFoodEntryAnalysisRequest("""{"compatible":true}""");

        // Act
        var response = await client.PatchAsJsonAsync("/api/food-entries/99999/analysis", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

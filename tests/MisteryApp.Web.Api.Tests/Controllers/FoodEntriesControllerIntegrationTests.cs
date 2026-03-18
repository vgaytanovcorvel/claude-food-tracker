using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;
using MisteryApp.Repository.Contexts;

namespace MisteryApp.Web.Api.Tests.Controllers;

[TestClass]
public class FoodEntriesControllerIntegrationTests
{
    private WebApplicationFactory<Program> factory = null!;
    private HttpClient client = null!;

    [TestInitialize]
    public void Setup()
    {
        factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptorsToRemove = services
                        .Where(d => d.ServiceType == typeof(IDbContextFactory<ApplicationDbContext>)
                            || d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>)
                            || d.ServiceType == typeof(DbContextOptions)
                            || (d.ServiceType.FullName != null
                                && d.ServiceType.FullName.Contains("ApplicationDbContext")))
                        .ToList();

                    foreach (var descriptor in descriptorsToRemove)
                        services.Remove(descriptor);

                    services.AddDbContextFactory<ApplicationDbContext>(options =>
                        options.UseInMemoryDatabase("FoodEntriesIntegrationTestDb_" + Guid.NewGuid()));
                });
            });

        client = factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        client.Dispose();
        factory.Dispose();
    }

    private async Task<int> CreateUserAsync()
    {
        var response = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Alice", DietStyle.Keto));
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>();
        return body!.Data!.Id;
    }

    [TestMethod]
    public async Task PostFoodEntry_ShouldReturn201_WhenRequestIsValid()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var request = new CreateFoodEntryRequest(userId, "Chicken breast", 300, FoodEntrySource.Manual);

        // Act
        var response = await client.PostAsJsonAsync("/api/food-entries", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FoodEntry>>();
        body!.Success.Should().BeTrue();
        body.Data!.FoodName.Should().Be("Chicken breast");
        body.Data.EstimatedCalories.Should().Be(300);
        body.Data.Source.Should().Be(FoodEntrySource.Manual);
        body.Data.AnalysisResult.Should().BeNull();
    }

    [TestMethod]
    public async Task PostFoodEntry_ShouldReturn400_WhenFoodNameIsEmpty()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var request = new { UserId = userId, FoodName = "", EstimatedCalories = 200, Source = 0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/food-entries", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [TestMethod]
    public async Task PostFoodEntry_ShouldReturn400_WhenCaloriesIsNegative()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var request = new { UserId = userId, FoodName = "Cake", EstimatedCalories = -1, Source = 0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/food-entries", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [TestMethod]
    public async Task PostFoodEntry_ShouldReturn404_WhenUserNotFound()
    {
        // Arrange
        var request = new CreateFoodEntryRequest(99999, "Rice", 250, FoodEntrySource.Manual);

        // Act
        var response = await client.PostAsJsonAsync("/api/food-entries", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [TestMethod]
    public async Task PostFoodEntry_ShouldReturn201_WhenSourceIsPhoto()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var request = new CreateFoodEntryRequest(userId, "Avocado toast", 350, FoodEntrySource.Photo);

        // Act
        var response = await client.PostAsJsonAsync("/api/food-entries", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FoodEntry>>();
        body!.Data!.Source.Should().Be(FoodEntrySource.Photo);
    }

    [TestMethod]
    public async Task DeleteFoodEntry_ShouldReturn204_WhenEntryExists()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var createResponse = await client.PostAsJsonAsync("/api/food-entries",
            new CreateFoodEntryRequest(userId, "Salad", 120, FoodEntrySource.Manual));
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<FoodEntry>>();
        var entryId = created!.Data!.Id;

        // Act
        var deleteResponse = await client.DeleteAsync($"/api/food-entries/{entryId}");

        // Assert
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [TestMethod]
    public async Task DeleteFoodEntry_ShouldReturn404_WhenEntryNotFound()
    {
        // Act
        var response = await client.DeleteAsync("/api/food-entries/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

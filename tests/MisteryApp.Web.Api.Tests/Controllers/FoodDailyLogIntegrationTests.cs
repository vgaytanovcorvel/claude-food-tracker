using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
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
public class FoodDailyLogIntegrationTests
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
                    options.UseInMemoryDatabase("FoodDailyLogDb_" + Guid.NewGuid()));
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
            new CreateFoodEntryRequest(userId, "Eggs", 200, FoodEntrySource.Manual));
        var entryBody = await entryResp.Content.ReadFromJsonAsync<ApiResponse<FoodEntry>>(JsonOptions);
        var entryId = entryBody!.Data!.Id;

        return (userId, entryId);
    }

    [TestMethod]
    public async Task GetDailyEntries_ShouldReturn200WithEntries_WhenEntriesExistForDate()
    {
        // Arrange
        var (userId, _) = await CreateUserAndEntryAsync();

        // Act — query for today (entries are stamped with server's UtcNow which is near today)
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var response = await client.GetAsync($"/api/food-entries?userId={userId}&date={today}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<List<FoodEntry>>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.Should().HaveCount(1);
        body.Data![0].FoodName.Should().Be("Eggs");
    }

    [TestMethod]
    public async Task GetDailyEntries_ShouldReturn200WithEmptyList_WhenNoEntriesForDate()
    {
        // Arrange
        var userResp = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Bob", DietStyle.Mediterranean));
        var userBody = await userResp.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        var userId = userBody!.Data!.Id;

        // Act — query a date in the past with no entries
        var response = await client.GetAsync($"/api/food-entries?userId={userId}&date=2026-01-01");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<List<FoodEntry>>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.Should().BeEmpty();
    }

    [TestMethod]
    public async Task GetSummary_ShouldReturn200WithCorrectSummary_WhenEntriesExist()
    {
        // Arrange
        var (userId, _) = await CreateUserAndEntryAsync();

        // Act — query summary for today
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var response = await client.GetAsync($"/api/food-entries/summary?userId={userId}&date={today}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<DailyLogSummary>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.TotalCalories.Should().Be(200);
        body.Data.ComplianceLabel.Should().Be("No meals analysed yet");
    }
}

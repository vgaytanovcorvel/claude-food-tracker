using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;
using MisteryApp.Repository.Contexts;

namespace MisteryApp.Web.Api.Tests.Controllers;

[TestClass]
public class CascadeDeleteIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private SqliteConnection sqliteConnection = null!;
    private WebApplicationFactory<Program> factory = null!;
    private HttpClient client = null!;

    [TestInitialize]
    public void Setup()
    {
        // Use a shared SQLite in-memory connection so FK cascades work
        sqliteConnection = new SqliteConnection("DataSource=:memory:");
        sqliteConnection.Open();

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
                    options
                        .UseSqlite(sqliteConnection)
                        .EnableSensitiveDataLogging(false));

                // Ensure schema is created
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var ctxFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<ApplicationDbContext>>();
                using var ctx = ctxFactory.CreateDbContext();
                ctx.Database.EnsureCreated();
                ctx.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
            }));
        client = factory.CreateClient();
    }

    [TestCleanup]
    public void Cleanup()
    {
        client.Dispose();
        factory.Dispose();
        sqliteConnection.Dispose();
    }

    [TestMethod]
    public async Task DeleteUser_ShouldCascadeDeleteFoodEntries_WhenUserDeleted()
    {
        // Arrange — create user
        var userResp = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Frank", DietStyle.LowFat));
        var userBody = await userResp.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        var userId = userBody!.Data!.Id;

        // Create two food entries
        await client.PostAsJsonAsync("/api/food-entries",
            new CreateFoodEntryRequest(userId, "Apple", 80, FoodEntrySource.Manual));
        await client.PostAsJsonAsync("/api/food-entries",
            new CreateFoodEntryRequest(userId, "Banana", 90, FoodEntrySource.Manual));

        // Verify entries exist
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var beforeResp = await client.GetAsync($"/api/food-entries?userId={userId}&date={today}");
        var beforeBody = await beforeResp.Content.ReadFromJsonAsync<ApiResponse<List<FoodEntry>>>(JsonOptions);
        beforeBody!.Data!.Should().HaveCount(2);

        // Act — delete the user
        var deleteResp = await client.DeleteAsync($"/api/users/{userId}");
        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Assert — user is gone
        var profileResp = await client.GetAsync($"/api/users/{userId}");
        profileResp.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Assert — food entries are cascade-deleted (SQLite FK enforcement)
        var afterResp = await client.GetAsync($"/api/food-entries?userId={userId}&date={today}");
        var afterBody = await afterResp.Content.ReadFromJsonAsync<ApiResponse<List<FoodEntry>>>(JsonOptions);
        afterBody!.Data!.Should().BeEmpty();
    }
}

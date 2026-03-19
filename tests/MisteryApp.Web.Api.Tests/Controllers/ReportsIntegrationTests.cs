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
public class ReportsIntegrationTests
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
                    options.UseInMemoryDatabase("ReportsDb_" + Guid.NewGuid()));
            }));
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
        var resp = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Alice", DietStyle.Keto));
        var body = await resp.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        return body!.Data!.Id;
    }

    [TestMethod]
    public async Task GetWeeklyReport_ShouldReturn200_WhenUserExists()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var weekStart = DateTime.UtcNow.ToString("yyyy-MM-dd");

        // Act
        var response = await client.GetAsync($"/api/reports/weekly?userId={userId}&weekStart={weekStart}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<WeeklyReport>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.DailySummaries.Should().HaveCount(7);
        body.Data.TotalCalories.Should().Be(0);
    }

    [TestMethod]
    public async Task GetWeeklyReport_ShouldReturn404_WhenUserNotFound()
    {
        // Arrange
        var weekStart = DateTime.UtcNow.ToString("yyyy-MM-dd");

        // Act
        var response = await client.GetAsync($"/api/reports/weekly?userId=9999&weekStart={weekStart}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [TestMethod]
    public async Task GetMonthlyReport_ShouldReturn200_WhenUserExists()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).ToString("yyyy-MM-dd");

        // Act
        var response = await client.GetAsync($"/api/reports/monthly?userId={userId}&monthStart={monthStart}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<MonthlyReport>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.DailySummaries.Count.Should().BeGreaterThan(27);
    }
}

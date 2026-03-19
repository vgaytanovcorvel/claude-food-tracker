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
public class UsersControllerIntegrationTests
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
        factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove all registrations related to ApplicationDbContext so we can replace with InMemory
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
                        options.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));
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

    [TestMethod]
    public async Task PostUser_ShouldReturn201_WhenRequestIsValid()
    {
        // Arrange
        var request = new CreateUserProfileRequest("Alice", DietStyle.Keto);

        // Act
        var response = await client.PostAsJsonAsync("/api/users", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        body!.Success.Should().BeTrue();
        body.Data!.Name.Should().Be("Alice");
        body.Data.DietStyle.Should().Be(DietStyle.Keto);
    }

    [TestMethod]
    public async Task GetUser_ShouldReturn200_WhenUserExists()
    {
        // Arrange — create a user first
        var createResponse = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Bob", DietStyle.LowFat));
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        var userId = created!.Data!.Id;

        // Act
        var response = await client.GetAsync($"/api/users/{userId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        body!.Data!.Id.Should().Be(userId);
        body.Data.Name.Should().Be("Bob");
    }

    [TestMethod]
    public async Task GetUser_ShouldReturn404_WhenUserNotFound()
    {
        // Act
        var response = await client.GetAsync("/api/users/9999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [TestMethod]
    public async Task PutUser_ShouldReturn200WithUpdatedDietStyle_WhenUserExists()
    {
        // Arrange
        var createResponse = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Carol", DietStyle.Keto));
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        var userId = created!.Data!.Id;

        // Act
        var updateResponse = await client.PutAsJsonAsync($"/api/users/{userId}",
            new UpdateUserProfileRequest(DietStyle.Mediterranean));

        // Assert
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await updateResponse.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        body!.Data!.DietStyle.Should().Be(DietStyle.Mediterranean);
    }

    [TestMethod]
    public async Task DeleteUser_ShouldReturn204_WhenUserExists()
    {
        // Arrange
        var createResponse = await client.PostAsJsonAsync("/api/users",
            new CreateUserProfileRequest("Dave", DietStyle.Keto));
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>(JsonOptions);
        var userId = created!.Data!.Id;

        // Act
        var deleteResponse = await client.DeleteAsync($"/api/users/{userId}");

        // Assert
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify user is gone
        var getResponse = await client.GetAsync($"/api/users/{userId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [TestMethod]
    public async Task PostUser_ShouldReturn400_WhenNameIsEmpty()
    {
        // Arrange — empty name
        var request = new { Name = "", DietStyle = 0 };

        // Act
        var response = await client.PostAsJsonAsync("/api/users", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}

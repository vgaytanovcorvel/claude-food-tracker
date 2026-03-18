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
public class BookmarksIntegrationTests
{
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
                    options.UseInMemoryDatabase("BookmarksDb_" + Guid.NewGuid()));
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
            new CreateUserProfileRequest("Bob", DietStyle.Mediterranean));
        var body = await resp.Content.ReadFromJsonAsync<ApiResponse<UserProfile>>();
        return body!.Data!.Id;
    }

    [TestMethod]
    public async Task CreateBookmark_ShouldReturn201_WhenValid()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var request = new CreateBookmarkRequest(userId, "Flatbread with hummus", null, null);

        // Act
        var response = await client.PostAsJsonAsync("/api/alternatives/bookmarks", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AlternativeBookmark>>();
        body!.Success.Should().BeTrue();
        body.Data!.AlternativeFoodName.Should().Be("Flatbread with hummus");
        body.Data.UserId.Should().Be(userId);
    }

    [TestMethod]
    public async Task GetUserBookmarks_ShouldReturn200_WithSavedBookmarks()
    {
        // Arrange
        var userId = await CreateUserAsync();
        await client.PostAsJsonAsync("/api/alternatives/bookmarks",
            new CreateBookmarkRequest(userId, "Quinoa bowl", null, null));
        await client.PostAsJsonAsync("/api/alternatives/bookmarks",
            new CreateBookmarkRequest(userId, "Grilled fish", null, null));

        // Act
        var response = await client.GetAsync($"/api/alternatives/bookmarks?userId={userId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<List<AlternativeBookmark>>>();
        body!.Success.Should().BeTrue();
        body.Data.Should().HaveCount(2);
    }

    [TestMethod]
    public async Task DeleteBookmark_ShouldReturn204_WhenExists()
    {
        // Arrange
        var userId = await CreateUserAsync();
        var createResp = await client.PostAsJsonAsync("/api/alternatives/bookmarks",
            new CreateBookmarkRequest(userId, "Cauli rice", null, null));
        var createBody = await createResp.Content.ReadFromJsonAsync<ApiResponse<AlternativeBookmark>>();
        var bookmarkId = createBody!.Data!.Id;

        // Act
        var response = await client.DeleteAsync($"/api/alternatives/bookmarks/{bookmarkId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify it's gone
        var listResp = await client.GetAsync($"/api/alternatives/bookmarks?userId={userId}");
        var listBody = await listResp.Content.ReadFromJsonAsync<ApiResponse<List<AlternativeBookmark>>>();
        listBody!.Data.Should().BeEmpty();
    }
}

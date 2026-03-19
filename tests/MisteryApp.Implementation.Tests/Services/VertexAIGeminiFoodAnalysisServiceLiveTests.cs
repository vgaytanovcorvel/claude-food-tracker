#pragma warning disable SKEXP0070
using FluentAssertions;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MisteryApp.Abstractions.Enums;
using MisteryApp.Implementation.Options;
using MisteryApp.Implementation.Services;

namespace MisteryApp.Implementation.Tests.Services;

/// <summary>
/// Live integration tests that call real Vertex AI.
/// These tests are skipped automatically when the service account file is not present.
/// Run selectively with: dotnet test --filter "TestCategory=Live"
/// </summary>
[TestClass]
[TestCategory("Live")]
public class VertexAIGeminiFoodAnalysisServiceLiveTests
{
    private const string ServiceAccountPath = @"C:\vertex-ai\corvel-ml-d6e48e345e37.json";

    private static IOptions<GeminiOptions> BuildOptions() =>
        Microsoft.Extensions.Options.Options.Create(new GeminiOptions
        {
            Model = "gemini-2.5-pro",
            ProjectId = "corvel-ml",
            Location = "us-central1",
            ServiceAccountPath = ServiceAccountPath,
            TimeoutSeconds = 30
        });

    [TestInitialize]
    public void SkipIfCredentialsMissing()
    {
        if (!File.Exists(ServiceAccountPath))
            Assert.Inconclusive($"Service account file not found at {ServiceAccountPath} — skipping live test.");
    }

    [TestMethod]
    public async Task KernelInvokePrompt_ShouldReturnRawText_ForDiagnostics()
    {
        // Directly invoke the SK kernel to inspect the raw response before parsing
        var opts = BuildOptions().Value;
        var builder = Kernel.CreateBuilder();
        builder.AddVertexAIGeminiChatCompletion(
            modelId: opts.Model,
            bearerTokenProvider: async () =>
            {
                var cred = GoogleCredential.FromFile(opts.ServiceAccountPath)
                    .CreateScoped("https://www.googleapis.com/auth/cloud-platform");
                return await cred.UnderlyingCredential.GetAccessTokenForRequestAsync();
            },
            location: opts.Location,
            projectId: opts.ProjectId);
        var kernel = builder.Build();

        var result = await kernel.InvokePromptAsync("Say hello in one word.");
        Console.WriteLine($"Type: {result.ValueType?.Name}");
        Console.WriteLine($"ToString: {result}");
        Console.WriteLine($"GetValue<string>: {result.GetValue<string>()}");

        // Now test with the actual food analysis prompt
        var foodPrompt = """
            You are a concise dietary assistant. Evaluate whether "Chocolate Cake" conflicts with the Keto diet.
            Keto: restrict to <20g net carbs/day; avoid grains, sugar, starchy veg, rice, noodles, bread, most fruit.
            Respond ONLY with a valid JSON object, no markdown fences, no explanation:
            {"compatible": true or false, "severity": "None"|"Low"|"Medium"|"High", "educationText": "1-2 sentence nutritional note, no medical claims.", "alternativeFoodName": "specific food or null"}
            Rules: compatible=true must have severity="None" and alternativeFoodName=null. compatible=false must have severity Low/Medium/High and a specific alternativeFoodName.
            """;
        var foodResult = await kernel.InvokePromptAsync(foodPrompt);
        Console.WriteLine($"--- Food Analysis Raw Response ---");
        Console.WriteLine(foodResult.GetValue<string>());
        Console.WriteLine($"---");

        result.Should().NotBeNull();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnRawResponse_ForDiagnostics()
    {
        // This test prints the raw Vertex AI response — useful when parsing breaks.
        var service = new VertexAIGeminiFoodAnalysisService(BuildOptions());
        var result = await service.AnalyseFoodAsync("Chocolate Cake", DietStyle.Keto, CancellationToken.None);

        Console.WriteLine($"Compatible: {result.Compatible}");
        Console.WriteLine($"Severity: {result.Severity}");
        Console.WriteLine($"EducationText: {result.EducationText}");
        Console.WriteLine($"AlternativeFoodName: {result.AlternativeFoodName}");

        // Not asserting anything — just capturing output for inspection
        result.Should().NotBeNull();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnConflict_WhenKetoUserLogsCake()
    {
        // Arrange
        var service = new VertexAIGeminiFoodAnalysisService(BuildOptions());

        // Act
        var result = await service.AnalyseFoodAsync("Chocolate Cake", DietStyle.Keto, CancellationToken.None);

        // Assert — cake is high carb, must conflict with Keto
        result.Compatible.Should().BeFalse();
        result.Severity.Should().NotBe(AnalysisSeverity.None);
        result.AlternativeFoodName.Should().NotBeNullOrWhiteSpace();
        result.EducationText.Should().NotBeNullOrWhiteSpace();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnCompatible_WhenKetoUserLogsChicken()
    {
        // Arrange
        var service = new VertexAIGeminiFoodAnalysisService(BuildOptions());

        // Act
        var result = await service.AnalyseFoodAsync("Grilled Chicken Breast", DietStyle.Keto, CancellationToken.None);

        // Assert — plain chicken is keto-compatible
        result.Compatible.Should().BeTrue();
        result.Severity.Should().Be(AnalysisSeverity.None);
        result.AlternativeFoodName.Should().BeNull();
        result.EducationText.Should().NotBeNullOrWhiteSpace();
    }

    [TestMethod]
    public async Task AnalyseFoodAsync_ShouldReturnValidResult_ForAllDietStyles()
    {
        // Arrange
        var service = new VertexAIGeminiFoodAnalysisService(BuildOptions());
        var dietStyles = Enum.GetValues<DietStyle>();

        foreach (var diet in dietStyles)
        {
            // Act
            var result = await service.AnalyseFoodAsync("Pizza", diet, CancellationToken.None);

            // Assert — response must be structurally valid regardless of diet
            result.Should().NotBeNull();
            result.EducationText.Should().NotBeNull();
            if (!result.Compatible)
            {
                result.Severity.Should().NotBe(AnalysisSeverity.None,
                    because: $"incompatible result for {diet} must have a non-None severity");
                result.AlternativeFoodName.Should().NotBeNullOrWhiteSpace(
                    because: $"incompatible result for {diet} must suggest an alternative");
            }
        }
    }
}

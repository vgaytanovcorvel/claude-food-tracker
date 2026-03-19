using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Web.Core.Controllers;

[ApiController]
[Route("api/food-entries")]
public class FoodEntriesController(
    IFoodLogService foodLogService,
    IVisionFoodIdentificationService visionService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<FoodEntry>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<FoodEntry>>> CreateFoodEntry(
        [FromBody] CreateFoodEntryRequest request,
        CancellationToken cancellationToken)
    {
        var entry = await foodLogService.AddFoodEntryAsync(request, cancellationToken);
        return Created(
            $"/api/food-entries/{entry.Id}",
            ApiResponse<FoodEntry>.Ok(entry));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteFoodEntry(
        int id,
        CancellationToken cancellationToken)
    {
        await foodLogService.DeleteFoodEntryAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/analyse")]
    [ProducesResponseType(typeof(ApiResponse<FoodAnalysisResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<FoodAnalysisResult>>> AnalyseFoodEntry(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await foodLogService.AnalyseFoodEntryAsync(id, cancellationToken);
        return Ok(ApiResponse<FoodAnalysisResult>.Ok(result));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FoodEntry>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FoodEntry>>>> GetDailyEntries(
        [FromQuery] int userId,
        [FromQuery] DateOnly date,
        [FromQuery] int timezoneOffsetMinutes = 0,
        CancellationToken cancellationToken = default)
    {
        var entries = await foodLogService.GetDailyEntriesAsync(userId, date, timezoneOffsetMinutes, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<FoodEntry>>.Ok(entries));
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<DailyLogSummary>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DailyLogSummary>>> GetDailySummary(
        [FromQuery] int userId,
        [FromQuery] DateOnly date,
        [FromQuery] int timezoneOffsetMinutes = 0,
        CancellationToken cancellationToken = default)
    {
        var summary = await foodLogService.GetDailySummaryAsync(userId, date, timezoneOffsetMinutes, cancellationToken);
        return Ok(ApiResponse<DailyLogSummary>.Ok(summary));
    }

    [HttpGet("{id:int}/alternative-image")]
    [ProducesResponseType(typeof(ApiResponse<AlternativeImageResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AlternativeImageResult>>> GetAlternativeImage(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await foodLogService.GetAlternativeImageForEntryAsync(id, cancellationToken);
        return Ok(ApiResponse<AlternativeImageResult>.Ok(result));
    }

    [HttpPost("{id:int}/suggest-alternative")]
    [ProducesResponseType(typeof(ApiResponse<AlternativeSuggestion>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AlternativeSuggestion>>> SuggestAlternative(
        int id,
        [FromBody] SuggestAlternativeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await foodLogService.SuggestAlternativeForEntryAsync(id, request.ExcludedNames, cancellationToken);
        return Ok(ApiResponse<AlternativeSuggestion>.Ok(result));
    }

    [HttpGet("suggest-image")]
    [ProducesResponseType(typeof(ApiResponse<AlternativeImageResult>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<AlternativeImageResult>>> GetSuggestImage(
        [FromQuery] string foodName,
        [FromQuery] int userId,
        CancellationToken cancellationToken)
    {
        var result = await foodLogService.GetImageForFoodNameAsync(foodName, userId, cancellationToken);
        return Ok(ApiResponse<AlternativeImageResult>.Ok(result));
    }

    [HttpPost("identify")]
    [ProducesResponseType(typeof(ApiResponse<FoodIdentificationResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<FoodIdentificationResult>>> IdentifyFood(
        [FromForm] IFormFile image,
        [FromForm] int userId,
        CancellationToken cancellationToken)
    {
        if (image is null || image.Length == 0)
            return BadRequest(ApiResponse<FoodIdentificationResult>.Fail(
                "Image is required.", HttpStatusCode.BadRequest));

        if (image.Length > 10 * 1024 * 1024)
            return BadRequest(ApiResponse<FoodIdentificationResult>.Fail(
                "Image must not exceed 10 MB.", HttpStatusCode.BadRequest));

        using var stream = image.OpenReadStream();
        var imageBytes = new byte[image.Length];
        await stream.ReadExactlyAsync(imageBytes, cancellationToken);

        var result = await visionService.IdentifyFoodAsync(imageBytes, userId, cancellationToken);
        return Ok(ApiResponse<FoodIdentificationResult>.Ok(result));
    }
}

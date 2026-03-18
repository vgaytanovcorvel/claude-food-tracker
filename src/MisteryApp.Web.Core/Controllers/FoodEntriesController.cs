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

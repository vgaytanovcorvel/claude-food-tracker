using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Web.Core.Controllers;

[ApiController]
[Route("api/food-entries")]
public class FoodEntriesController(IFoodLogService foodLogService) : ControllerBase
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
}

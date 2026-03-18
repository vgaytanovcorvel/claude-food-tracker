using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Web.Core.Controllers;

[ApiController]
[Route("api/alternatives/bookmarks")]
public class BookmarksController(IAlternativeBookmarkService bookmarkService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AlternativeBookmark>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<AlternativeBookmark>>> CreateBookmark(
        [FromBody] CreateBookmarkRequest request,
        CancellationToken cancellationToken)
    {
        var bookmark = await bookmarkService.CreateBookmarkAsync(request, cancellationToken);
        return Created(
            $"/api/alternatives/bookmarks/{bookmark.Id}",
            ApiResponse<AlternativeBookmark>.Ok(bookmark));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AlternativeBookmark>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AlternativeBookmark>>>> GetUserBookmarks(
        [FromQuery] int userId,
        CancellationToken cancellationToken)
    {
        var bookmarks = await bookmarkService.GetUserBookmarksAsync(userId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<AlternativeBookmark>>.Ok(bookmarks));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteBookmark(
        int id,
        CancellationToken cancellationToken)
    {
        await bookmarkService.DeleteBookmarkAsync(id, cancellationToken);
        return NoContent();
    }
}

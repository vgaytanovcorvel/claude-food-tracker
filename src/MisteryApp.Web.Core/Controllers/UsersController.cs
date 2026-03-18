using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;
using MisteryApp.Abstractions.Requests;

namespace MisteryApp.Web.Core.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(IUserProfileService userProfileService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UserProfile>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<UserProfile>>> CreateUserProfile(
        [FromBody] CreateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var profile = await userProfileService.CreateUserProfileAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetUserProfile),
            new { id = profile.Id },
            ApiResponse<UserProfile>.Ok(profile));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserProfile>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserProfile>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UserProfile>>> GetUserProfile(
        int id,
        CancellationToken cancellationToken)
    {
        var profile = await userProfileService.GetUserProfileByIdAsync(id, cancellationToken);
        if (profile is null)
            return NotFound(ApiResponse<UserProfile>.Fail($"User not found (UserId: {id}).", HttpStatusCode.NotFound));
        return Ok(ApiResponse<UserProfile>.Ok(profile));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserProfile>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<UserProfile>>> UpdateUserProfile(
        int id,
        [FromBody] UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var profile = await userProfileService.UpdateUserProfileAsync(id, request, cancellationToken);
        return Ok(ApiResponse<UserProfile>.Ok(profile));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult> DeleteUserProfile(
        int id,
        CancellationToken cancellationToken)
    {
        await userProfileService.DeleteUserProfileAsync(id, cancellationToken);
        return NoContent();
    }
}

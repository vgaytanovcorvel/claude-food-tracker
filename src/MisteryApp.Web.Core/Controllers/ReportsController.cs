using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MisteryApp.Abstractions.Interfaces;
using MisteryApp.Abstractions.Models;

namespace MisteryApp.Web.Core.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("weekly")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyReport>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<WeeklyReport>>> GetWeeklyReport(
        [FromQuery] int userId,
        [FromQuery] DateOnly weekStart,
        CancellationToken cancellationToken)
    {
        var report = await reportService.GetWeeklyReportAsync(userId, weekStart, cancellationToken);
        return Ok(ApiResponse<WeeklyReport>.Ok(report));
    }

    [HttpGet("monthly")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyReport>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<MonthlyReport>>> GetMonthlyReport(
        [FromQuery] int userId,
        [FromQuery] DateOnly monthStart,
        CancellationToken cancellationToken)
    {
        var report = await reportService.GetMonthlyReportAsync(userId, monthStart, cancellationToken);
        return Ok(ApiResponse<MonthlyReport>.Ok(report));
    }
}

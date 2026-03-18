using MisteryApp.Abstractions.Models;

namespace MisteryApp.Abstractions.Interfaces;

public interface IReportService
{
    Task<WeeklyReport> GetWeeklyReportAsync(int userId, DateOnly weekStart, CancellationToken cancellationToken);
    Task<MonthlyReport> GetMonthlyReportAsync(int userId, DateOnly monthStart, CancellationToken cancellationToken);
}

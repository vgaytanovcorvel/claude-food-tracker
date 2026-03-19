using MisteryApp.Abstractions.Enums;

namespace MisteryApp.Abstractions.Models;

public record AnalysisPreviewResult(
    bool Compatible,
    AnalysisSeverity Severity,
    string? EducationText,
    string? AlternativeFoodName,
    int EstimatedCalories);

using MisteryApp.Abstractions.Enums;

namespace MisteryApp.Abstractions.Models;

public record FoodAnalysisResult(
    bool Compatible,
    AnalysisSeverity Severity,
    string EducationText,
    string? AlternativeFoodName);

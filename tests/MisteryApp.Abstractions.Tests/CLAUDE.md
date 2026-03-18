# MisteryApp.Abstractions.Tests

Tests for `MisteryApp.Abstractions`.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

Tests for domain model logic — `Result<T>`, `ApiResponse<T>`, exception types, and any domain value validation. No mocking needed since Abstractions has no external dependencies.

## Testing Conventions

- Framework: **MSTest** + **FluentAssertions**
- Test naming: `MethodName_ShouldResult_WhenCondition`

# MisteryApp.Web.Core.Tests

Tests for `MisteryApp.Web.Core` controllers and filters.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

Unit tests for API controllers. Inject mock service interfaces into controller constructors. Assert that controllers return the correct `ApiResponse<T>` status codes and payloads. Do not test exception handling here — that belongs in the hosting integration tests.

## Testing Conventions

- Framework: **MSTest** + **Moq** (`MockBehavior.Strict`) + **FluentAssertions**
- Test naming: `MethodName_ShouldResult_WhenCondition`

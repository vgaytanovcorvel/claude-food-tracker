# MisteryApp.Common.Tests

Tests for `MisteryApp.Common`.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

Unit tests for shared types in Common. Typically minimal since Common has no behavior — tests mainly cover value object equality and any utility logic.

## Testing Conventions

- Framework: **MSTest** + **FluentAssertions**
- Test naming: `MethodName_ShouldResult_WhenCondition`

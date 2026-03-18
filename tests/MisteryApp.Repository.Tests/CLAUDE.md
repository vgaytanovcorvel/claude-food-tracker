# MisteryApp.Repository.Tests

Tests for `MisteryApp.Repository` — repository implementations and DbContext logic.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

Tests for repository classes using EF Core InMemory provider. Mock `IDbContextFactory<ApplicationDbContext>` or use a real InMemory factory for integration-style unit tests. Repository method tests verify correct query behavior, `AsNoTracking()` usage, and mapping fidelity.

## Testing Conventions

- Framework: **MSTest** + **Moq** (`MockBehavior.Strict`) + **FluentAssertions**
- InMemory DB: `Microsoft.EntityFrameworkCore.InMemory` (already in csproj)
- Test naming: `MethodName_ShouldResult_WhenCondition`

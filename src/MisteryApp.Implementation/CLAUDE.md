# MisteryApp.Implementation

Business logic layer — concrete implementations of the service interfaces declared in Abstractions. Orchestrates domain operations using injected repository interfaces and other services.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/logging.md
@../../rules/common/patterns.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/domain.md
@../../rules/csharp/services.md

## Module Purpose

Implements `IXxxService` interfaces from Abstractions. Services operate exclusively on domain models — they never touch ORM entities. All public methods must be `virtual` to support Moq strict-mock isolation in tests.

## Key Contents

- `Extensions/ImplementationServiceCollectionExtensions` — `AddMisteryAppServices()` registers `TimeProvider.System` and all FluentValidation validators
- FluentValidation validators for request models

## Dependency Constraints

**Allowed**: `MisteryApp.Abstractions`, `MisteryApp.Common`
**Forbidden**: Repository (no direct EF Core or DbContext), Web.*, Cli

# MisteryApp.Common

Shared, framework-agnostic types used across all layers — enums, constants, primitive value objects, and shared DTOs that carry no business logic.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/patterns.md
@../../rules/csharp/coding-style.md

## Module Purpose

Contains only types that have zero dependencies — no services, no ORM, no ASP.NET. If a type needs a project reference to exist, it belongs in a different assembly.

## Key Contents

- Shared enums
- Shared constants
- Primitive value objects (no behavior)

## Dependency Constraints

**Allowed**: None (no project references)
**Forbidden**: Any reference to Abstractions, Implementation, Repository, or any framework-specific package

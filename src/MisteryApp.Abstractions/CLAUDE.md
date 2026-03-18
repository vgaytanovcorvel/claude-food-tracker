# MisteryApp.Abstractions

Domain layer — defines the business contracts (interfaces, domain models, exceptions) that all other layers depend on. Contains no implementations.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/patterns.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/domain.md

## Module Purpose

Exposes the pure domain model: `record` types for domain entities, `interface` contracts for services and repositories, and typed exceptions (`NotFoundException`, etc.). Nothing in this assembly knows about EF Core, ASP.NET, or any infrastructure.

## Key Contents

- `Models/ApiResponse<T>` — standard API envelope
- `Models/Result<T>` — discriminated result type for service return values
- `Exceptions/NotFoundException` — thrown by repository `Single*` methods

## Dependency Constraints

**Allowed**: `MisteryApp.Common`
**Forbidden**: Implementation, Repository, Web.*, Cli, EntityFrameworkCore, AspNetCore

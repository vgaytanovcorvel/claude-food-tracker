# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is a **baseline "mystery app"** — a pre-scaffolded C# clean architecture solution that developers can open and immediately start building with Claude Code, without wasting time on project setup or architecture decisions.

## Commands

```powershell
# Build the solution
dotnet build MisteryApp.slnx

# Run all tests
dotnet test MisteryApp.slnx

# Run tests with coverage (80% threshold enforced)
dotnet test /p:CollectCoverage=true /p:Threshold=80

# Run a single test project
dotnet test tests/MisteryApp.Implementation.Tests/

# Run a specific test method
dotnet test --filter "FullyQualifiedName~MethodName_ShouldResult_WhenCondition"

# EF Core migrations (run from solution root, targeting Repository project)
dotnet ef migrations add <MigrationName> --project src/MisteryApp.Repository
dotnet ef database update --project src/MisteryApp.Repository

# Run the API
dotnet run --project src/MisteryApp.Web.Api

# Run the web server (with Angular SPA)
dotnet run --project src/MisteryApp.Web.Server

# Run the CLI
dotnet run --project src/MisteryApp.Cli -- --help
```

## Architecture

This solution follows **clean architecture** with these assemblies (see `rules/csharp/modularization.md` for full details):

```
src/
├── MisteryApp.Common/          ← Shared DTOs, enums, constants (no project deps)
├── MisteryApp.Abstractions/    ← Domain models, interfaces, exceptions (depends on Common)
├── MisteryApp.Implementation/  ← Service implementations, business logic (depends on Abstractions)
├── MisteryApp.Repository/      ← EF Core repos, entities, migrations (depends on Abstractions)
├── MisteryApp.Web.Core/        ← Controllers, filters, middleware (depends on Implementation)
├── MisteryApp.Web.Api/         ← API host, Program.cs, Swagger (depends on Web.Core + Repository)
├── MisteryApp.Web.Server/      ← SPA host (optional, depends on Web.Core + Repository)
└── MisteryApp.Cli/             ← CLI host, System.CommandLine 2.0.5 with manual DI (depends on all)

tests/
├── MisteryApp.Implementation.Tests/
├── MisteryApp.Repository.Tests/
├── MisteryApp.Web.Core.Tests/
└── ...
```

**Dependency rule**: inner layers never depend on outer layers. `Abstractions` must never reference `Implementation` or `Repository`.

## Key Conventions

### Coding (rules/csharp/coding-style.md)
- C# 12+ features: primary constructors, `record` types, collection expressions, file-scoped namespaces
- All public/internal methods on service and repository classes **must be `virtual`** (required for Moq isolation)
- No `static` methods on service classes
- `FluentValidation` for all request validation — no Data Annotations on records
- Inject `TimeProvider` instead of calling `DateTime.UtcNow` directly

### Assembly boundaries (rules/csharp/modularization.md)
- `Abstractions`: domain models (no ORM attrs), repository interfaces, service interfaces, exceptions
- `Repository`: ORM entity classes (`UserEntity` etc.), EF Core DbContext, mapping to/from domain models
- `Implementation`: service implementations — operate on domain models, never on ORM entities
- Each assembly registers its own services via `Add{Feature}()` extension in `Microsoft.Extensions.DependencyInjection` namespace

### Repository pattern (rules/common/patterns.md + rules/csharp/persistence.md)
- Method names prefixed by entity: `UserSingleByIdAsync`, `UserAddAsync`, `OrderGetAllAsync`
- `Single*` methods throw `NotFoundException`; `SingleOrDefault*` return `null`
- Use `IDbContextFactory<T>` (not `DbContext` directly) — each method creates a short-lived `await using` context
- Read queries always use `AsNoTracking()`
- ORM entities never leak outside the Repository assembly

### Testing (rules/csharp/testing.md)
- Framework: **MSTest** + **Moq** (`MockBehavior.Strict`) + **FluentAssertions**
- Every test class creates `Mock<SUT>` (not `new SUT()`) — enables one-method-deep isolation
- Mock the SUT using factory syntax: `new Mock<MyService>(() => new MyService(dep1, dep2), MockBehavior.Strict)`
- All Setup calls chained with `.Verifiable(Times.Once())`; every test ends with `.VerifyAll()`
- Use `FakeTimeProvider` from `Microsoft.Extensions.TimeProvider.Testing` for time-dependent tests
- Naming: `MethodName_ShouldResult_WhenCondition`

### API responses (rules/csharp/domain.md)
- All endpoints return `ApiResponse<T>` envelope with `Success`, `Data`, `Error`, `StatusCode`
- Global exception handler in `Program.cs` catches unhandled exceptions — controllers do NOT use try/catch for response shaping

## Rules Reference

Detailed rules live in `rules/`. Apply them automatically based on file type:

| File pattern | Rules |
|---|---|
| `**/*.cs` | `rules/csharp/` + `rules/common/` |
| `**/*.ts`, `**/*.html` | `rules/typescript/` + `rules/common/` |

Key rule files:
- `rules/csharp/modularization.md` — assembly structure and dependency flow
- `rules/csharp/domain.md` — Abstractions layer patterns
- `rules/csharp/persistence.md` — Repository layer patterns
- `rules/csharp/services.md` — Implementation layer patterns
- `rules/csharp/presentation.md` — Web.Core controllers and minimal APIs
- `rules/csharp/hosting.md` — Program.cs pipeline, middleware order, global exception handler
- `rules/csharp/testing.md` — MSTest + Moq patterns (strict mocks, virtual methods, VerifyAll)
- `rules/typescript/angular.md` — Angular 19+ signals, standalone components, control flow syntax

## Available Skills

Use these skills to scaffold or validate work:

- `/clean-architecture:bootstrap-clean-arch` — scaffold projects and generate per-module CLAUDE.md files
- `/clean-architecture:install-clean-arch-rules` — reinstall/update rules in `rules/`
- `/simplify` — review changed code for quality issues after implementing a feature

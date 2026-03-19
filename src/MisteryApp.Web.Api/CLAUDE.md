# MisteryApp.Web.Api

API hosting project — minimal `Program.cs` pipeline that wires up all layers, configures Swagger, and registers a global exception handler.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/logging.md
@../../rules/common/security.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/persistence.md
@../../rules/csharp/presentation.md
@../../rules/csharp/hosting.md
@../../rules/csharp/security.md

## Module Purpose

Thin host that composes all layers via DI extensions (`AddMisteryAppServices()`, `AddPersistence()`, `AddWebCore()`). The global exception handler here maps `NotFoundException` → 404, `UnauthorizedAccessException` → 401, and all others → 500, all wrapped in `ApiResponse<object>.Fail(...)`. No business logic lives here.

## Key Contents

- `Program.cs` — full middleware pipeline: exception handler → HTTPS → routing → auth → Swagger → MapControllers
- Ends with `public partial class Program;` for integration test support

## Dependency Constraints

**Allowed**: `MisteryApp.Web.Core`, `MisteryApp.Implementation`, `MisteryApp.Repository`
**Forbidden**: `MisteryApp.Abstractions` directly (access through Web.Core or services), Cli

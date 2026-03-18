# MisteryApp.Web.Server

SPA hosting project — serves the API alongside static Angular files, with a fallback to `index.html` for client-side routing.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/logging.md
@../../rules/common/patterns.md
@../../rules/common/security.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/persistence.md
@../../rules/csharp/presentation.md
@../../rules/csharp/hosting.md
@../../rules/csharp/security.md

## Module Purpose

Same pipeline as Web.Api plus `UseStaticFiles()` and `MapFallbackToFile("index.html")`. Use this project when shipping a combined SPA + API. Use Web.Api when the frontend is separately deployed.

## Key Contents

- `Program.cs` — same middleware as Web.Api plus SPA static file serving

## Dependency Constraints

**Allowed**: `MisteryApp.Web.Core`, `MisteryApp.Implementation`, `MisteryApp.Repository`
**Forbidden**: Cli

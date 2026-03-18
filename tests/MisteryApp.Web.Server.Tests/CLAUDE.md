# MisteryApp.Web.Server.Tests

Integration tests for `MisteryApp.Web.Server` using `WebApplicationFactory<Program>`.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

Same pattern as Web.Api.Tests but targeting the SPA host. Includes tests for SPA fallback behavior (`/non-existent-route` returns `index.html`).

## Testing Conventions

- Framework: **MSTest** + **Moq** + **FluentAssertions** + `Microsoft.AspNetCore.Mvc.Testing`
- Test naming: `MethodName_ShouldResult_WhenCondition`

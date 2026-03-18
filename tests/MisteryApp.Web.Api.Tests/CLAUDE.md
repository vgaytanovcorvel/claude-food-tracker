# MisteryApp.Web.Api.Tests

Integration tests for `MisteryApp.Web.Api` using `WebApplicationFactory<Program>`.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

End-to-end HTTP tests that spin up the real ASP.NET pipeline. Use `WebApplicationFactory<Program>` to override services with test doubles. Tests verify the full request/response cycle including global exception handling, status codes, and `ApiResponse<T>` envelopes.

## Testing Conventions

- Framework: **MSTest** + **Moq** + **FluentAssertions** + `Microsoft.AspNetCore.Mvc.Testing`
- Override DI: `factory.WithWebHostBuilder(b => b.ConfigureServices(...))`
- Test naming: `MethodName_ShouldResult_WhenCondition`

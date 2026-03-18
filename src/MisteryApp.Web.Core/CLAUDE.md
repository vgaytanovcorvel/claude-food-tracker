# MisteryApp.Web.Core

Presentation layer — API controllers, action filters, and shared middleware used by both Web.Api and Web.Server hosting projects.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/logging.md
@../../rules/common/patterns.md
@../../rules/common/security.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/services.md
@../../rules/csharp/presentation.md
@../../rules/csharp/security.md

## Module Purpose

Houses all `[ApiController]` controllers and shared middleware/filters. Controllers inject service interfaces from Abstractions and return `ApiResponse<T>` envelopes. They do not contain business logic or try/catch blocks for response shaping — exceptions bubble up to the global handler in the hosting project.

## Key Contents

- `Extensions/WebCoreServiceCollectionExtensions` — `AddWebCore()` registers controllers and FluentValidation auto-validation

## Dependency Constraints

**Allowed**: `MisteryApp.Abstractions`, `MisteryApp.Implementation`, `MisteryApp.Common`
**Forbidden**: Repository (controllers never touch DbContext or entity classes), Cli

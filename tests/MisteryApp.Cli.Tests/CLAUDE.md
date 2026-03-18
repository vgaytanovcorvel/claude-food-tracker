# MisteryApp.Cli.Tests

Tests for `MisteryApp.Cli` command handlers.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

Unit tests for individual CLI command actions. Parse the command with test args and assert exit codes and service call counts. Inject mock services via the host's `ConfigureServices` override.

## Testing Conventions

- Framework: **MSTest** + **Moq** (`MockBehavior.Strict`) + **FluentAssertions**
- Test naming: `MethodName_ShouldResult_WhenCondition`

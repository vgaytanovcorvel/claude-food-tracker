# MisteryApp.Implementation.Tests

Tests for `MisteryApp.Implementation` service classes.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/testing.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/testing.md

## Module Purpose

Unit tests for service implementations. Each test class instantiates the SUT via `Mock<MySvc>` (not `new MySvc()`) to enable one-method-deep isolation. All dependencies are mocked with `MockBehavior.Strict`.

## Testing Conventions

- Framework: **MSTest** + **Moq** (`MockBehavior.Strict`) + **FluentAssertions**
- `Mock<SUT>` factory: `new Mock<MyService>(() => new MyService(dep1.Object, dep2.Object), MockBehavior.Strict)`
- Every Setup ends with `.Verifiable(Times.Once())`; every test ends with `mock.VerifyAll()`
- Time-dependent tests: inject `FakeTimeProvider` from `Microsoft.Extensions.TimeProvider.Testing`
- Test naming: `MethodName_ShouldResult_WhenCondition`

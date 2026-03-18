# MisteryApp.Cli

Command-line interface host — System.CommandLine 2.0.5 with manual `IHost` DI wiring.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/logging.md
@../../rules/common/patterns.md
@../../rules/common/security.md
@../../rules/common/command-line.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/services.md
@../../rules/csharp/hosting.md
@../../rules/csharp/command-line.md
@../../rules/csharp/security.md

## Module Purpose

Entry point for CLI tooling. `Program.cs` builds an `IHost` with all services registered, then constructs the `RootCommand` tree. Subcommands resolve services from `host.Services` via closures. Use `System.CommandLine 2.0.5` API: `command.SetAction(Func<ParseResult, CancellationToken, Task<int>>)`, not the old `CommandLineBuilder`/`UseHost()` pattern (those were removed in 2.0.x stable).

## Key Contents

- `Program.cs` — host construction, root command definition, `rootCommand.Parse(args).InvokeAsync()`
- `GlobalUsings.cs` — `System.CommandLine`, hosting, DI namespaces

## CLI Patterns (System.CommandLine 2.0.5)

```csharp
// Option with alias — constructor takes (name, params string[] aliases)
var myOption = new Option<bool>("--my-option", "-m");
myOption.Description = "Description here";

// Add to command
command.Options.Add(myOption);

// Set handler — receives ParseResult and CancellationToken
command.SetAction(async (ParseResult result, CancellationToken ct) =>
{
    var myValue = result.GetValue(myOption);
    var service = host.Services.GetRequiredService<IMyService>();
    // ...
    return 0;
});

// Invoke
return await rootCommand.Parse(args).InvokeAsync();
```

## Dependency Constraints

**Allowed**: `MisteryApp.Abstractions`, `MisteryApp.Implementation`, `MisteryApp.Repository`, `MisteryApp.Common`
**Forbidden**: Web.* projects

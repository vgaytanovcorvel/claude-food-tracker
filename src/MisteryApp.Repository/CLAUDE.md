# MisteryApp.Repository

Data access layer — EF Core DbContext, entity classes, repository implementations, and database migrations. Translates between ORM entities and domain models.

## Rules

@../../rules/common/coding-style.md
@../../rules/common/patterns.md
@../../rules/csharp/coding-style.md
@../../rules/csharp/persistence.md
@../../rules/csharp/security.md

## Module Purpose

Owns everything database-related: entity classes (named `XxxEntity`), `ApplicationDbContext`, `IEntityTypeConfiguration<T>` configs, migrations, and concrete repository classes. Entities never leak outside this assembly — repositories return/accept domain model types from Abstractions.

## Key Contents

- `Contexts/ApplicationDbContext` — EF Core DbContext with `ApplyConfigurationsFromAssembly`
- `RepositoryBase<TContext>` — abstract base using `IDbContextFactory<TContext>` for thread-safe access
- `Extensions/PersistenceServiceCollectionExtensions` — `AddPersistence()` registers `AddDbContextFactory<ApplicationDbContext>`

## Dependency Constraints

**Allowed**: `MisteryApp.Abstractions`, `MisteryApp.Common`
**Forbidden**: Implementation (no service logic here), Web.*, Cli

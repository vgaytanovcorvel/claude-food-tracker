using var host = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration((ctx, config) =>
    {
        config.AddJsonFile("appsettings.json", optional: true);
        config.AddEnvironmentVariables(prefix: "MISTERYAPP_");
    })
    .ConfigureServices((ctx, services) =>
    {
        services.AddMisteryAppServices();
        services.AddPersistence(ctx.Configuration);
    })
    .Build();

await host.StartAsync();

var verboseOption = new Option<bool>("--verbose", "-v");
verboseOption.Description = "Enable verbose output";

var quietOption = new Option<bool>("--quiet", "-q");
quietOption.Description = "Suppress non-error output";

var jsonOption = new Option<bool>("--json");
jsonOption.Description = "Output results as JSON";

var rootCommand = new RootCommand("MisteryApp CLI");
rootCommand.Options.Add(verboseOption);
rootCommand.Options.Add(quietOption);
rootCommand.Options.Add(jsonOption);

var exitCode = await rootCommand.Parse(args).InvokeAsync();

await host.StopAsync();
return exitCode;

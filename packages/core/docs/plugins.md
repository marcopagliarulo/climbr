# Plugins

A **plugin** is a command that lives outside `commandsDir` and is registered explicitly via `cli.use()`. This is useful for:

- Commands distributed as separate packages
- Commands that should only be present in specific environments or configurations
- Conditional command registration based on runtime context

## Creating a plugin

A plugin command follows the same structure as any auto-discovered command — a function returning a `Command`:

```ts
// src/plugins/deploy/command.ts
import { Command, CliUtils } from '@climbr/core';

export default function deployCommand(): Command {
  return new Command('deploy')
    .description('Deploy the application')
    .argument('<env>', 'Target environment')
    .action((env: string) => {
      CliUtils.showBoxedSuccessMessage({
        title: 'Deploying',
        message: `Targeting environment: ${env}`,
      });
    });
}
```

The only difference from auto-discovered commands is **location** — it's placed outside `commandsDir`, so it won't be picked up automatically.

## Registering a plugin

Import the command and pass it to `cli.use()` before calling `cli.run()`:

```ts
// src/bin/index.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCli } from '@climbr/core';
import deployCommand from '../plugins/deploy/command.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cli = createCli({
  name: 'my-tool',
  version: '1.0.0',
  commandsDir: join(__dirname, '../commands'),
});

cli.use(deployCommand());

await cli.run();
```

`.use()` returns the `ClimbrInstance`, so calls can be chained:

```ts
cli
  .use(deployCommand())
  .use(rollbackCommand())
  .use(migrateCommand());

await cli.run();
```

## Plugins from external packages

A plugin can come from an npm package that exports a Commander `Command`:

```ts
import { createCli, Command } from '@climbr/core';
import { auditCommand } from 'my-org/cli-audit-plugin';

const cli = createCli({ name: 'my-tool', version: '1.0.0' });

cli.use(auditCommand());

await cli.run();
```

## Overriding built-in commands

Built-in commands are discovered after user commands and plugins. If a plugin has the same name as a built-in, **the plugin takes precedence** — the built-in is simply never added.

```ts
import { createCli, Command } from '@climbr/core';

const myConfigCommand = new Command('config')
  .description('Custom config management')
  // ...

const cli = createCli({ name: 'my-tool', version: '1.0.0' });
cli.use(myConfigCommand());
await cli.run();
```

Alternatively, define a `config/command.ts` inside your `commandsDir` and it will be picked up before the built-in is ever considered.

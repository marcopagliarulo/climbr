# @climbr/core
![Climbr](./climbr.svg)

A TypeScript-first framework for building Node.js CLI tools. It wires together [Commander](https://github.com/tj/commander.js), [Inquirer](https://github.com/SBoudrias/Inquirer.js), [Zod](https://zod.dev), [Ora](https://github.com/sindresorhus/ora), [Chalk](https://github.com/chalk/chalk), and [Boxen](https://github.com/sindresorhus/boxen) with a convention-based auto-discovery system.

## Philosophy

Climbr is **opinionated by design**. It does not expose every option of the underlying packages — instead it makes deliberate choices about structure, conventions, and defaults so you can focus on your CLI's business logic rather than wiring boilerplate together. If you need fine-grained control over Commander, Inquirer, or other internals, the underlying packages are always available to use directly alongside climbr.

## Features

- **Auto-discovery** — drop a `command.ts` file in a directory and it's registered automatically
- **Zod-validated config** — persistent per-command and global configuration with type safety
- **Plugin system** — register external commands explicitly via `.use()`
- **Built-in config command** — interactive `config get/set/delete` out of the box
- **Full prompt suite** — text, number, password, select, search, confirm, array, and object prompts

## Installation

```bash
npm install @climbr/core
```

## Quick start

```ts
// src/bin/index.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCli } from '@climbr/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cli = createCli({
  name: 'my-tool',
  version: '1.0.0',
  commandsDir: join(__dirname, '../commands'),
});

await cli.run();
```

Drop a command at `src/commands/hello/command.ts`:

```ts
import { Command, CliUtils } from '@climbr/core';

export default (): Command =>
  new Command('hello')
    .description('Say hello')
    .argument('<name>', 'Who to greet')
    .action((name: string) => {
      CliUtils.showBoxedSuccessMessage({ message: `Hello, ${name}!` });
    });
```

```bash
my-tool hello World
```

## Documentation

| Guide | Description |
|---|---|
| [Getting started](https://github.com/marcopagliarulo/climbr/blob/main/packages/core/docs/getting-started.md) | Project setup, `createCli` options, running your CLI |
| [Commands](https://github.com/marcopagliarulo/climbr/blob/main/packages/core/docs/commands.md) | Creating commands, conventions, subcommands |
| [Configuration](https://github.com/marcopagliarulo/climbr/blob/main/packages/core/docs/configuration.md) | Persistent config with Zod schemas |
| [Plugins](https://github.com/marcopagliarulo/climbr/blob/main/packages/core/docs/plugins.md) | Registering commands explicitly via `.use()` |
| [CliUtils API](https://github.com/marcopagliarulo/climbr/blob/main/packages/core/docs/cli-utils.md) | All prompts, output methods, and formatters |

## Exports

```ts
// Framework
import { createCli } from '@climbr/core';

// Services
import { ConfigStoreService, CacheService } from '@climbr/core';

// Utilities
import { CliUtils, capitalize } from '@climbr/core';

// Re-exports (no extra dependency needed in your package)
import { z } from '@climbr/core';
import { Command } from '@climbr/core';

// Types
import type {
  ClimbrOptions,
  ClimbrInstance,
  ConfigDefinition,
  ConfigSchema,
  InferConfig,
} from '@climbr/core';
```

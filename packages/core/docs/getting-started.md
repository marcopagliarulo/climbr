# Getting started

## Prerequisites

- Node.js ≥ 18
- A project using `"type": "module"` in `package.json`

## Installation

```bash
npm install @climbr/core
```

## Project structure

```
my-cli/
├── src/
│   ├── bin/
│   │   └── index.ts          ← entry point
│   ├── commands/             ← auto-discovered
│   │   └── hello/
│   │       ├── command.ts
│   │       └── config.ts     ← optional
│   └── globalConfig/
│       └── config.ts         ← optional global config
├── package.json
└── tsconfig.json
```

## Entry point

Create `src/bin/index.ts`:

```ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCli } from '@climbr/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cli = createCli({
  name: 'my-tool',
  version: '1.0.0',
  description: 'My CLI tool',
  commandsDir: join(__dirname, '../commands'),
  configDir: join(__dirname, '../globalConfig'),  // optional
});

await cli.run();
```

## `createCli` options

| Option | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Display name (used in help output and as default config namespace) |
| `version` | `string` | yes | Version string shown by `--version` |
| `description` | `string` | no | Description shown in help output |
| `commandsDir` | `string` | no | Absolute path to auto-discover commands from. Defaults to `<cwd>/src/commands` |
| `configDir` | `string` | no | Absolute path to discover a global config file from |
| `configStoreName` | `string` | no | Namespace for the config store on disk. Defaults to `name` |
| `defaults.config` | `false \| Command` | no | Pass `false` to disable the built-in `config` command, or a `Command` to override it |

## `ClimbrInstance`

`createCli` returns a `ClimbrInstance`:

```ts
interface ClimbrInstance {
  // Register a plugin command explicitly (does not require auto-discovery)
  use(command: Command): ClimbrInstance;  // chainable

  // Parse process.argv and start the CLI
  run(): Promise<void>;

  // The underlying Commander program (for advanced configuration)
  program: Command;

  // The config store (for reading config outside of commands)
  configStore: ConfigStoreService;
}
```

## Running in development

Use [tsx](https://github.com/privatenumber/tsx) to run TypeScript directly without a build step:

```bash
npx tsx src/bin/index.ts <command>
```

## Global flags

Every CLI built with climbr gets a `--debug` flag for free:

```bash
my-tool --debug <command>
# sets process.env.DEBUG = 'true'
# CliUtils.showDebug() messages become visible
```

## Built-in commands and how they load

Built-in commands (like `config`) are discovered after your own commands and plugins. The discovery logic skips any name already registered, so **a command in `commandsDir` or registered via `.use()` always wins**.

The built-in `config` command also only registers itself when at least one config scope has been discovered (global or per-command). If your CLI has no config files, the command simply does not appear.

### Overriding the built-in config command

Create a `config/command.ts` inside your `commandsDir`:

```
commandsDir/
└── config/
    └── command.ts    ← your implementation, built-in is never loaded
```

### Suppressing the built-in config command

Remove all config files from `commandsDir` and `configDir`. With no scopes registered the built-in command will not be added to the program.

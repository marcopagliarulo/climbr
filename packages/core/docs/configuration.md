# Configuration

Climbr provides a persistent, Zod-validated configuration system backed by [configstore](https://github.com/yeoman/configstore). Config is organised into **scopes** — each command gets its own scope, and there is an optional global scope.

## Defining a config file

Create a `config.ts` file alongside your `command.ts`:

```
commandsDir/
└── deploy/
    ├── command.ts
    └── config.ts     ← config for the `deploy` command
```

The file must export a `ConfigDefinition` as its default export:

```ts
// src/commands/deploy/config.ts
import { z } from '@climbr/core';
import type { ConfigDefinition } from '@climbr/core';

export default {
  scope: 'deploy',        // must match the command name
  schema: z.object({
    environment: z.enum(['staging', 'production']).default('staging'),
    timeout: z.number().min(1).default(30),
    dryRun: z.boolean().default(false),
  }),
} as ConfigDefinition;
```

The `scope` is the key used to namespace the config on disk and in `ConfigStoreService`.

## Global config

To define config that is not tied to a specific command, create a config file in the directory passed as `configDir`:

```ts
// src/globalConfig/config.ts
import { z } from '@climbr/core';
import type { ConfigDefinition } from '@climbr/core';

export default {
  scope: 'global',
  schema: z.object({
    apiUrl: z.string().url().default('https://api.example.com'),
    verbose: z.boolean().default(false),
  }),
} as ConfigDefinition;
```

```ts
// bin/index.ts
const cli = createCli({
  name: 'my-tool',
  version: '1.0.0',
  configDir: join(__dirname, '../globalConfig'),
});
```

## Supported Zod types

The built-in `config set` command introspects the Zod schema to determine the right interactive prompt:

| Zod type | Prompt used |
|---|---|
| `z.string()` | Free-text input |
| `z.number()` | Numeric input |
| `z.boolean()` | True / False select |
| `z.enum([...])` | Single select |
| `z.array(...)` | Repeated input until empty |
| `z.object(...)` | JSON editor |

All other types fall back to free-text input.

## Reading config in a command

Use the `ConfigStoreService` singleton:

```ts
import { Command, ConfigStoreService } from '@climbr/core';

export default (): Command =>
  new Command('deploy')
    .action(() => {
      const store = ConfigStoreService.getInstance();
      const env = store?.get('deploy', 'environment') as string;
      const timeout = store?.get('deploy', 'timeout') as number;
      console.log(`Deploying to ${env} with timeout ${timeout}s`);
    });
```

To read the full config object for a scope with type safety:

```ts
import { z } from '@climbr/core';
import type { InferConfig } from '@climbr/core';

const schema = z.object({
  environment: z.enum(['staging', 'production']).default('staging'),
  timeout: z.number().default(30),
});

type DeployConfig = InferConfig<typeof schema>;

const config = store?.getAll<typeof schema>('deploy') as DeployConfig;
// config.environment → 'staging' | 'production'
// config.timeout → number
```

## Built-in `config` command

When at least one config scope is discovered (a `config.ts` in `commandsDir` or `configDir`), climbr registers a built-in `config` command with three subcommands:

```bash
my-tool config get [scope] [key]      # display a value
my-tool config set [scope] [key]      # set a value interactively
my-tool config delete [scope] [key]   # delete a value (with confirmation)
```

If `scope` or `key` are omitted, the command prompts interactively using the registered scopes and keys.

### Example session

```
$ my-tool config set
? Select a scope to set: Deploy
? Select a key to set: environment
? Enter value for 'environment': production

╭ Configuration Updated ──────────────────╮
│                                         │
│  Scope: deploy                          │
│  Key:   environment                     │
│  Value: production                      │
│                                         │
╰─────────────────────────────────────────╯
```

## `ConfigStoreService` API

| Method | Description |
|---|---|
| `ConfigStoreService.initialize(name)` | Create the singleton (called by the framework) |
| `ConfigStoreService.getInstance(name?)` | Get the singleton; optionally initialize if not yet created |
| `store.get(scope, key)` | Get a single value (falls back to Zod default) |
| `store.getAll<T>(scope)` | Get all values for a scope merged with defaults |
| `store.set(scope, key, value)` | Persist a value (validated against schema) |
| `store.delete(scope, key)` | Remove a stored value |
| `store.getScopes()` | List all registered scopes |
| `store.getKeys(scope)` | List all keys in a scope |
| `store.hasScope(scope)` | Check if a scope is registered |
| `store.hasKey(scope, key)` | Check if a key exists in a scope |
| `store.validateScope(scope)` | Throw if scope not registered |
| `store.validateConfigKey(scope, key)` | Throw if key not in scope |

Config is stored at `~/.config/configstore/<configStoreName>.json`.

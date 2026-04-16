# Commands

## Convention

A command is a directory inside `commandsDir` containing a `command.ts` (source) or `command.js` (compiled) file. The file must have a **default export that is a function returning a `Command` instance**.

```
commandsDir/
└── <name>/
    └── command.ts    ← required
```

Auto-discovery is fully recursive, so nested directories work as subcommands:

```
commandsDir/
├── deploy/
│   ├── command.ts            ← `deploy`
│   ├── staging/
│   │   └── command.ts        ← `deploy staging`
│   └── production/
│       └── command.ts        ← `deploy production`
└── rollback/
    └── command.ts            ← `rollback`
```

## Anatomy of a command file

```ts
// src/commands/hello/command.ts
import { Command, CliUtils } from '@climbr/core';

export default (): Command =>
  new Command('hello')
    .description('Say hello')
    .argument('<name>', 'Who to greet')
    .option('-u, --uppercase', 'Print in uppercase')
    .action((name: string, opts: { uppercase?: boolean }) => {
      let message = `Hello, ${name}!`;
      if (opts.uppercase) message = message.toUpperCase();
      CliUtils.showBoxedSuccessMessage({ title: 'Greeting', message });
    });
```

The default export is a **factory function** — not the `Command` directly. This allows the framework to call it at the right time during startup.

## Using `ConfigStoreService` inside a command

If the command has a config file (see [Configuration](./configuration.md)), retrieve values via the singleton:

```ts
import { Command, CliUtils, ConfigStoreService } from '@climbr/core';

export default (): Command =>
  new Command('greet')
    .description('Greet using saved defaults')
    .action(() => {
      const store = ConfigStoreService.getInstance();
      const name = store?.get('greet', 'defaultName') as string || 'stranger';
      CliUtils.showSuccess(`Hello, ${name}!`);
    });
```

## Using `CacheService` inside a command

```ts
import { Command, CliUtils, CacheService } from '@climbr/core';

const cache = new CacheService();

export default (): Command =>
  new Command('fetch')
    .description('Fetch data with caching')
    .action(async () => {
      const cached = cache.get<string>('my-data');
      if (cached) {
        CliUtils.showInfo('Using cached data.');
        return;
      }

      CliUtils.startSpinner('Fetching…');
      const data = await fetchSomething();
      cache.set('my-data', data, 300); // cache for 5 minutes
      CliUtils.stopSpinner(true, 'Done.');
    });
```

## Async actions

Command actions can be async. Commander and climbr both handle `Promise`-returning actions correctly:

```ts
.action(async (opts) => {
  const answer = await CliUtils.promptConfirm({ message: 'Continue?' });
  if (!answer) return;
  // ...
});
```

## Error handling

Throw from an action to surface an error. For user-facing errors, use `CliUtils.showError()`:

```ts
.action(() => {
  try {
    doSomething();
  } catch (error) {
    CliUtils.showError(error instanceof Error ? error.message : 'Unknown error');
    // exits by default — pass false as second argument to log without exiting
  }
});
```

## Built-in commands

The framework ships a built-in `config` command that provides interactive configuration management:

```bash
my-tool config get        # display a value
my-tool config set        # set a value interactively
my-tool config delete     # delete a value (with confirmation)
```

See [Configuration](./configuration.md) for the full config system reference.

### Loading order and precedence

Built-in commands are discovered **after** user commands and plugins. The discovery skips any command name that is already registered, so your commands always take precedence — no special option is needed to override a built-in.

The `config` command is additionally conditional: it only registers itself when at least one config scope has been discovered (a `config.ts` file in `commandsDir` or `configDir`). A CLI with no config files will not have a `config` command at all.

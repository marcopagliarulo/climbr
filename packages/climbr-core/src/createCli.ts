import { join } from 'path';
import { existsSync } from 'fs';
import { Command } from 'commander';
import CommandDiscoveryService from '@climbr/core/services/commandDiscovery/index.js';
import ConfigStoreService from '@climbr/core/services/configStore/index.js';
import { createConfigCommand } from '@climbr/core/commands/config/index.js';
import type {
  ClimbrOptions,
  ClimbrPlugin,
  ClimbrInstance,
} from '@climbr/core/types/framework.js';

/**
 * Create and configure a climbr CLI instance.
 *
 * @example
 * ```ts
 * import { createCli } from 'climbr';
 * import { fileURLToPath } from 'url';
 * import { dirname, join } from 'path';
 *
 * const __dirname = dirname(fileURLToPath(import.meta.url));
 *
 * const cli = createCli({
 *   name: 'my-tool',
 *   version: '1.0.0',
 *   commandsDir: join(__dirname, 'commands'),
 * });
 *
 * cli.run();
 * ```
 */
export function createCli(options: ClimbrOptions): ClimbrInstance {
  const {
    name,
    version,
    description = '',
    commandsDir = join(process.cwd(), 'src', 'commands'),
    configStoreName = name,
    defaults = {},
  } = options;

  const program = new Command();
  program
    .name(name)
    .description(description)
    .version(version)
    .showHelpAfterError()
    .usage('[global options] command')
    .option('-d, --debug', 'Enable debug mode', false)
    .on('option:debug', () => {
      process.env.DEBUG = 'true';
    });

  const configStore = new ConfigStoreService(configStoreName);

  // Plugin registry — keyed by command name for override detection
  const plugins = new Map<string, ClimbrPlugin>();

  const instance: ClimbrInstance = {
    program,
    configStore,

    use(plugin: ClimbrPlugin): ClimbrInstance {
      plugins.set(plugin.name(), plugin);
      return instance;
    },

    async run(): Promise<void> {
      // 1. Discover commands and config schema from the consumer's commandsDir
      const discovery = new CommandDiscoveryService(
        commandsDir,
      );

      const schema = await discovery.loadConfigSchema();
      configStore.init(schema);

      // 2. Load auto-discovered commands into the program
      if (existsSync(commandsDir)) {
        await discovery.loadCommands(program);
      }

      // 3. Register built-in default commands (unless disabled or overridden)
      registerDefaults(defaults, plugins, program, configStore);

      // 4. Register any explicitly added plugins (overrides take effect here)
      for (const plugin of plugins.values()) {
        program.addCommand(plugin);
      }

      // 5. Parse and execute
      program.parse(process.argv);
    },
  };

  return instance;
}

/**
 * Registers built-in default commands unless they have been disabled or
 * superseded by a consumer plugin with the same name.
 */
function registerDefaults(
  defaults: ClimbrOptions['defaults'],
  plugins: Map<string, ClimbrPlugin>,
  program: Command,
  configStore: ConfigStoreService,
): void {
  const configOverride = defaults?.config;

  if (configOverride !== false && !plugins.has('config')) {
    if (configOverride instanceof Command) {
      // Consumer passed their own Command as the override
      program.addCommand(configOverride);
    } else {
      program.addCommand(createConfigCommand(configStore));
    }
  }
}

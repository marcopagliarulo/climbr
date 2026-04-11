import { dirname, join } from 'path';
import { Command } from 'commander';
import CommandDiscoveryService from '@climbr/core/services/commandDiscovery/index.js';
import ConfigStoreService from '@climbr/core/services/configStore/index.js';
import type {
  ClimbrOptions,
  ClimbrInstance,
} from '@climbr/core/types/framework.js';
import CliUtils from '@climbr/core/utils/cli.js';
import ConfigDiscoveryService from './services/configDiscovery/index.js';
import { fileURLToPath } from 'url';

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
    configDir,
    configStoreName = name,
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

  const configStore = ConfigStoreService.initialize(configStoreName);

  // Plugin registry — keyed by command name for override detection
  const plugins = new Map<string, Command>();

  const instance: ClimbrInstance = {
    program,
    configStore,

    use(command: Command): ClimbrInstance {
      plugins.set(command.name(), command);
      return instance;
    },

    async run(): Promise<void> {
      try {
        // Discover configurations.
        const configDiscovery = new ConfigDiscoveryService(
          commandsDir,
          configDir
        );

        configDiscovery.discover(configStore);

        // Discover commands.
        const commandDiscovery = new CommandDiscoveryService(
          commandsDir,
        );
        await commandDiscovery.discover(program);

        // Register any command provided as plugin.
        for (const plugin of plugins.values()) {
          program.addCommand(plugin);
        }


        const dir = dirname(fileURLToPath(import.meta.url));

        const builtInCommandDir = join(dir, 'commands');

        // Discover built-in default commands unless the discover dir
        // has been already used for all the commands.
        const builtIncommandDiscovery = new CommandDiscoveryService(
          builtInCommandDir
        );
        await builtIncommandDiscovery.discover(program);

        // 5. Parse and execute
        await program.parseAsync(process.argv);
      } catch (error) {
        CliUtils.showError(
          error instanceof Error ? error.message : 'Unknown error',
          true,
        );
      }
    },
  };

  return instance;
}


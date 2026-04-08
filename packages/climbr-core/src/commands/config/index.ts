import { Command, Argument } from 'commander';
import createGetCommand from '@climbr/core/commands/config/get/index.js';
import createSetCommand from '@climbr/core/commands/config/set/index.js';
import createDeleteCommand from '@climbr/core/commands/config/delete/index.js';
import { pickScope, pickKey } from '@climbr/core/commands/config/utils.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';

type configCommandCallback =  (a: Command, b: ConfigStoreService) => Command;
function configCommandFactory(
  name: string,
  description: string,
  configStore: ConfigStoreService,
  callback: configCommandCallback ): Command {
  const command = new Command(name)
    .description(description)
    .argument('[scope]', 'Command name or "global"')
    .argument('[key]', 'Configuration key');

  return callback(command, configStore);
}
/**
 * Creates the built-in `config` command, wired to the ConfigStoreService.
 * Registered automatically by the framework unless disabled via `defaults.config: false`.
 *
 * Can also be used directly for manual registration:
 * @example
 * ```ts
 * import { createConfigCommand } from 'climbr-config';
 * cli.use(createConfigCommand(cli.configStore));
 * ```
 */
export function createConfigCommand(configStore: ConfigStoreService): Command {
  return new Command('config')
    .description('Manage CLI configuration')
    .hook('preAction', async (thisCommand, actionCommand) => {
      const scope = actionCommand.processedArgs[0] as string;
      const key = actionCommand.processedArgs[1] as string;

      const pickedScope = scope || (await pickScope(configStore, 'get'));
      const pickedKey = key || (await pickKey(configStore, pickedScope, 'get'));

      actionCommand.processedArgs[0] = pickedScope;
      actionCommand.processedArgs[0] = pickedKey;
    })
    .addCommand(configCommandFactory('get', 'Get a configuration value', configStore, createGetCommand))
    .addCommand(createSetCommand(configStore))
    .addCommand(createDeleteCommand(configStore));
}


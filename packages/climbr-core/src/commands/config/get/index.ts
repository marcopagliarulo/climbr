import { Command } from 'commander';
import CLI from '@climbr/core/utils/cli.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';
import {
  pickCommand,
  pickCommandConfigKey,
  validateCommand,
  validateConfigKey,
} from '@climbr/core/commands/config/utils.js';

export default function createGetCommand(
  configStore: ConfigStoreService,
): Command {
  return new Command('get')
    .description('Get a configuration value')
    .argument('[command]', 'Command name or "global"')
    .argument('[key]', 'Configuration key')
    .action(async (command: string, key: string) => {
      try {
        if (command) validateCommand(configStore, command);
        if (command && key) validateConfigKey(configStore, command, key);

        const pickedCommand =
          command || (await pickCommand(configStore, 'get'));
        const pickedKey =
          key ||
          (await pickCommandConfigKey(configStore, pickedCommand, 'get'));
        const value = configStore.get({
          command: pickedCommand,
          key: pickedKey,
        }) as string | number | boolean | object;

        CLI.showBoxedInfoMessage({
          message: `Key: ${pickedKey}\nValue: ${CLI.formatValue({ value })}`,
          title: 'Configuration Value',
        });
      } catch (error) {
        CLI.showError(
          error instanceof Error ? error.message : 'Unknown error',
          true,
        );
      }
    });
}

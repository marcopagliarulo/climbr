import { Command } from 'commander';
import CLI from '@climbr/core/utils/cli.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';
import {
  pickCommand,
  pickCommandConfigKey,
  validateCommand,
  validateConfigKey,
} from '@climbr/core/commands/config/utils.js';

export default function createDeleteCommand(
  configStore: ConfigStoreService,
): Command {
  return new Command('delete')
    .description('Delete a configuration value')
    .argument('[command]', 'Command name or "global"')
    .argument('[key]', 'Configuration key')
    .action(async (command: string, key: string) => {
      try {
        if (command) validateCommand(configStore, command);
        if (command && key) validateConfigKey(configStore, command, key);

        const pickedCommand =
          command || (await pickCommand(configStore, 'delete'));
        const pickedKey =
          key ||
          (await pickCommandConfigKey(configStore, pickedCommand, 'delete'));

        const confirmed = await CLI.promptConfirm({
          message: `Delete config for command '${pickedCommand}', key '${pickedKey}'?`,
        });

        if (!confirmed) {
          CLI.showInfo('Deletion cancelled.');
          return;
        }

        configStore.delete({ command: pickedCommand, key: pickedKey });
        CLI.showSuccess(
          `Deleted '${pickedKey}' from '${pickedCommand}' configuration.`,
        );
      } catch (error) {
        CLI.showError(error instanceof Error ? error.message : 'Unknown error');
      }
    });
}

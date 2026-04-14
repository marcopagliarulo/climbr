import { Command } from 'commander';
import CLI from '../../../utils/cli.js';
import type ConfigStoreService from '../../../services/configStore/index.js';

export default function createDeleteCommand(
  command: Command,
  configStore: ConfigStoreService,
): Command {
  command.action(async (scope: string, key: string) => {
    try {
      const confirmed = await CLI.promptConfirm({
        message: `Delete config from '${scope}', key '${key}'?`,
      });

      if (!confirmed) {
        CLI.showInfo('Deletion cancelled.');
        return;
      }

      configStore.delete(scope, key);
      CLI.showSuccess(`Deleted '${key}' from '${scope}' configuration.`);
    } catch (error) {
      CLI.showError(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  return command;
}

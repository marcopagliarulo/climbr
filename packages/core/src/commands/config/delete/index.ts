import { Command } from 'commander';
import CLI from '../../../utils/cli.js';
import type ConfigStoreService from '../../../services/configStore/index.js';

/**
 * Wire the `delete` action onto the given Commander command.
 * @param command - The pre-configured Commander command to attach the action to.
 * @param configStore - The config store to delete values from.
 * @returns The command with the action attached.
 */
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

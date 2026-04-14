import { Command } from 'commander';
import CLI from '../../../utils/cli.js';
import type ConfigStoreService from '../../../services/configStore/index.js';

/**
 * Wire the `get` action onto the given Commander command.
 * @param command - The pre-configured Commander command to attach the action to.
 * @param configStore - The config store to read values from.
 * @returns The command with the action attached.
 */
export default function createGetCommand(
  command: Command,
  configStore: ConfigStoreService,
): Command {
  command.action((scope: string, key: string) => {
    try {
      const value = configStore.get(scope, key) as string;

      CLI.showBoxedInfoMessage({
        message: `Key: ${key}\nValue: ${CLI.formatValue({ value })}`,
        title: 'Configuration Value',
      });
    } catch (error) {
      CLI.showError(
        error instanceof Error ? error.message : 'Unknown error',
        true,
      );
    }
  });

  return command;
}

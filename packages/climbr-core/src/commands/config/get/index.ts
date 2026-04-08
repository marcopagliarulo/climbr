import { Command } from 'commander';
import CLI from '@climbr/core/utils/cli.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';

export default function createGetCommand(
  command: Command,
  configStore: ConfigStoreService,
): Command {
  command.action((scope: string, key: string) => {
    try {
      const value = configStore.get(
        scope,
        key,
      ) as string;

      CLI.showBoxedInfoMessage({
        message: `Key: ${key}\nValue: ${CLI.formatValue({ value  })}`,
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

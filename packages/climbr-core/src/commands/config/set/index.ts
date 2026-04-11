import { inspect } from 'util';
import { Command } from 'commander';
import CLI from '@climbr/core/utils/cli.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';

export function setAction(
  configStore: ConfigStoreService,
  scope: string,
  key: string,
  value: unknown,
): void {
  try {

    const inputValue: unknown = value;

    configStore.set(scope, key, value);

    const valueString = (() => {
      if (inputValue === null) return 'null';
      if (inputValue === undefined) return 'undefined';
      switch (typeof inputValue) {
        case 'string':
          return inputValue;
        case 'number':
        case 'boolean':
        case 'bigint':
        case 'symbol':
        case 'function':
          return inputValue.toString();
        case 'object':
          try {
            return JSON.stringify(inputValue);
          } catch {
            return inspect(inputValue, { depth: null, colors: false });
          }
        default:
          return 'unknown';
      }
    })();

    CLI.showBoxedSuccessMessage({
      message: [
        `Scope: ${scope}`,
        `Key: ${key}`,
        `Value: ${valueString}`,
      ].join('\n'),
      title: 'Configuration Updated',
    });
  } catch (error) {
    CLI.showError(
      error instanceof Error ? error.message : 'Unknown error',
      true,
    );
  }
}

export default function createSetCommand(
  command: Command,
  configStore: ConfigStoreService,
): Command {
  command
    .argument('[value]', 'Value to set')
    .action((scope, key, value) =>
      setAction(
        configStore,
        scope as string,
        key as string,
        value as unknown,
      ),
    );

  return command;
}

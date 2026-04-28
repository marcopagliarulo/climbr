import { inspect } from 'util';
import { EOL } from 'os';
import { Command } from 'commander';
import { promptForZodField } from '../utils.js';
import CLI from '../../../utils/cli.js';
import type ConfigStoreService from '../../../services/configStore/index.js';

/**
 * Validate and persist a config value, then display a confirmation message.
 * @param configStore - The config store to write to.
 * @param scope - The config scope.
 * @param key - The config key.
 * @param value - The value to set.
 */
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
      message: [`Scope: ${scope}`, `Key: ${key}`, `Value: ${valueString}`].join(
        '\n',
      ),
      title: 'Configuration Updated',
    });
  } catch (error) {
    CLI.showError(
      error instanceof Error ? error.message : 'Unknown error',
      true,
    );
  }
}

/**
 * Wire the `set` action onto the given Commander command.
 * @param command - The pre-configured Commander command to attach the action to.
 * @param configStore - The config store to write values to.
 * @returns The command with the action attached.
 */
export default function createSetCommand(
  command: Command,
  configStore: ConfigStoreService,
): Command {
  command
    .argument('[value]', 'Value to set')
    .action(async (scope: string, key: string, value: unknown) => {
        const fieldSchema = configStore.getFieldSchema(scope, key);
        if (fieldSchema) {
          if (value) {
            const result = await fieldSchema.safeParseAsync(value);
            if (!result.success) {
              throw new Error(result.error?.issues.reduce((acc, v) => acc + v.message + EOL, ''));
            }
          }
          const pickedValue = value || (await promptForZodField(fieldSchema, key));
          setAction(configStore, scope, key, pickedValue);
        }
      },
    );

  return command;
}

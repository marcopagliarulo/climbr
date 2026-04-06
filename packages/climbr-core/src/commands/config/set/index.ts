import { inspect } from 'util';
import { Command } from 'commander';
import { capitalize } from '@climbr/core/utils/string.js';
import CLI from '@climbr/core/utils/cli.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';
import {
  pickCommand,
  pickCommandConfigKey,
  validateCommand,
  validateConfigKey,
} from '@climbr/core/commands/config/utils.js';

export async function setAction(
  configStore: ConfigStoreService,
  command?: string,
  key?: string,
  value?: unknown,
): Promise<void> {
  try {
    if (command) validateCommand(configStore, command);
    if (command && key) validateConfigKey(configStore, command, key);

    const pickedCommand = command || (await pickCommand(configStore, 'set'));
    const pickedKey =
      key || (await pickCommandConfigKey(configStore, pickedCommand, 'set'));

    let inputValue: unknown = value;

    if (!inputValue) {
      const definition = configStore.getConfigDefinition({
        command: pickedCommand,
        key: pickedKey,
      });

      if (!definition) {
        CLI.showError(
          `No configuration found for command: ${pickedCommand}, key: ${pickedKey}`,
        );
        return;
      }

      const message = `Enter the value for ${pickedKey}:`;

      switch (definition.type) {
        case 'string':
          inputValue = await CLI.promptInput({
            message,
            required: definition.required ?? false,
            defaultValue: (definition.default as string) ?? undefined,
            validate: definition.validate ?? undefined,
          });
          break;
        case 'number':
          inputValue = await CLI.promptNumber({
            message,
            required: definition.required ?? false,
            defaultValue: (definition.default as number) ?? undefined,
            validate: definition.validate
              ? (v: number | undefined) =>
                  // adapt the generic config validate to the number prompt signature
                  definition.validate!(
                    v as unknown as string | number | boolean | object,
                  )
              : undefined,
          });
          break;
        case 'enum':
          inputValue = await CLI.promptSelect({
            message,
            choices:
              definition.options?.map((o) => ({
                name: capitalize(o),
                value: o,
              })) ?? [],
            defaultValue: (definition.default as string) ?? undefined,
          });
          if (definition.validate) {
            const result = definition.validate(inputValue as string);
            if (result !== true) {
              CLI.showError(result as string);
              return;
            }
          }
          break;
        case 'array':
          inputValue = await CLI.promptArray({
            message,
            validate: definition.validate ?? undefined,
          });
          break;
        case 'object':
          inputValue = await CLI.promptObject({
            message,
            defaultValue: (definition.default as string) ?? undefined,
            validate: definition.validate ?? undefined,
          });
          break;
        case 'boolean':
          inputValue = await CLI.promptBoolean(message);
          break;
        default:
          CLI.showError('The configuration type is not correctly defined');
      }
    }

    configStore.set({
      command: pickedCommand,
      key: pickedKey,
      value: inputValue,
    });

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
        `Command: ${pickedCommand}`,
        `Key: ${pickedKey}`,
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
  configStore: ConfigStoreService,
): Command {
  return new Command('set')
    .description('Set a configuration value')
    .argument('[command]', 'Command name or "global"')
    .argument('[key]', 'Configuration key')
    .argument('[value]', 'Value to set')
    .action((command, key, value) =>
      setAction(
        configStore,
        command as string | undefined,
        key as string | undefined,
        value as unknown,
      ),
    );
}

import CLI from '@climbr/core/utils/cli.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';
import type { PromptSelect } from '@climbr/core/types/cli.js';

const pickOption = async <T>({
  message,
  choices,
}: PromptSelect<T>): Promise<T | string> => {
  if (choices.length === 0) return '';
  if (choices.length === 1) return choices[0]!.value;
  return CLI.promptSelect({ message, choices });
};

export const validateCommand = (
  configStore: ConfigStoreService,
  command: string,
): void => {
  if (!configStore.validateCommandName(command)) {
    const available = configStore.getConfigCommandNames().join(', ');
    throw new Error(
      `Invalid configurable command: '${command}'. Available: ${available}`,
    );
  }
};

export const validateConfigKey = (
  configStore: ConfigStoreService,
  command: string,
  key: string,
): void => {
  if (!configStore.validateConfigKey(command, key)) {
    throw new Error(
      `The config key '${key}' for command '${command}' does not exist.`,
    );
  }
};

export const pickCommand = async (
  configStore: ConfigStoreService,
  action: string,
): Promise<string> => {
  const choices = configStore.getConfigCommandNames().map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: name,
  }));
  return pickOption<string>({
    message: `Select a command to ${action} the configuration for:`,
    choices,
  });
};

export const pickCommandConfigKey = async (
  configStore: ConfigStoreService,
  command: string,
  action: string,
): Promise<string> => {
  const choices = configStore.getConfigKeysNames(command).map((name) => ({
    name,
    value: name,
  }));
  return pickOption<string>({
    message: `Select a configuration key to ${action} the configuration for:`,
    choices,
  });
};

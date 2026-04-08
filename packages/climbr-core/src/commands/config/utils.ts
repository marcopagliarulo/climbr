import { z } from 'zod';
import CLI from '@climbr/core/utils/cli.js';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';
import type { InquirerChoice, PromptSelect } from '@climbr/core/types/cli.js';

/**
 * Generic single-pick helper — auto-selects if only one choice, prompts otherwise.
 */
const pickOption = async <T>({ message, choices }: PromptSelect<T>): Promise<T> => {
  if (choices.length === 1) {
    const choice = choices.shift() as InquirerChoice<T>;
    return choice.value;
  }
  return CLI.promptSelect({ message, choices });
};

export const pickScope = async (configStore: ConfigStoreService, action: string): Promise<string> => {
  const choices = configStore.getScopes().map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
  }));
  return pickOption<string>({ message: `Select a scope to ${action}:`, choices });
};

export const pickKey = async (
  configStore: ConfigStoreService,
  scope: string,
  action: string,
): Promise<string> => {
  const choices = configStore.getKeys(scope).map((k) => ({ name: k, value: k }));
  return pickOption<string>({ message: `Select a key to ${action}:`, choices });
};

/**
 * Introspect a Zod schema to determine the best prompt type and call the
 * appropriate CLI prompt method. Returns the validated value.
 */
export const promptForZodField = async (
  fieldSchema: z.ZodTypeAny,
  key: string,
): Promise<unknown> => {
  const message = `Enter value for '${key}':`;

  // Unwrap ZodDefault to get the inner type and default value
//  let innerSchema = fieldSchema;
  let defaultValue: unknown;

  if (fieldSchema instanceof z.ZodDefault) {
    defaultValue = fieldSchema.parse(undefined);
  }

  if (fieldSchema instanceof z.ZodString) {
    return CLI.promptInput({
      message,
      defaultValue: defaultValue as string | undefined,
      required: true,
    });
  }

  if (fieldSchema instanceof z.ZodNumber) {
    return CLI.promptNumber({
      message,
      defaultValue: defaultValue as number | undefined,
      required: true,
    });
  }

  if (fieldSchema instanceof z.ZodBoolean) {
    return CLI.promptBoolean(message);
  }

  if (fieldSchema instanceof z.ZodEnum) {
    const options = fieldSchema.options as string[];
    return CLI.promptSelect({
      message,
      choices: options.map((o) => ({ name: o, value: o })),
      defaultValue: defaultValue as string | undefined,
    });
  }

  if (fieldSchema instanceof z.ZodArray) {
    return CLI.promptArray({ message });
  }

  if (fieldSchema instanceof z.ZodObject) {
    return CLI.promptObject({ message });
  }

  // Fallback: treat as string and let Zod validate on set
  return CLI.promptInput({ message, required: true });
};

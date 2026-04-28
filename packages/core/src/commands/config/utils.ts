import { EOL } from 'os';
import { z } from 'zod';
import CLI from '../../utils/cli.js';
import type ConfigStoreService from '../../services/configStore/index.js';
import type { InquirerChoice, PromptSelect } from '../../types/cli.js';

// Auto-selects if only one choice, prompts otherwise.
const pickOption = async <T>({
  message,
  choices,
}: PromptSelect<T>): Promise<T> => {
  if (choices.length === 1) {
    const choice = choices.shift() as InquirerChoice<T>;
    return choice.value;
  }
  return CLI.promptSelect({ message, choices });
};

/**
 * Prompt the user to select a registered config scope.
 * Auto-selects if only one scope is registered.
 * @param configStore - The config store to read scopes from.
 * @param action - Verb shown in the prompt (e.g. `'get'`, `'set'`).
 * @returns The selected scope name.
 */
export const pickScope = async (
  configStore: ConfigStoreService,
  action: string,
): Promise<string> => {
  const choices = configStore.getScopes().map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
  }));
  return pickOption<string>({
    message: `Select a scope to ${action}:`,
    choices,
  });
};

/**
 * Prompt the user to select a key within a config scope.
 * Auto-selects if the scope contains only one key.
 *
 * @param configStore - The config store to read keys from.
 * @param scope - The scope to list keys for.
 * @param action - Verb shown in the prompt (e.g. `'get'`, `'set'`).
 * @returns The selected key name.
 */
export const pickKey = async (
  configStore: ConfigStoreService,
  scope: string,
  action: string,
): Promise<string> => {
  const choices = configStore
    .getKeys(scope)
    .map((k) => ({ name: k, value: k }));
  return pickOption<string>({ message: `Select a key to ${action}:`, choices });
};

/**
 * Introspect a Zod schema to determine the best prompt type and invoke the
 * appropriate CLI prompt method.
 * @param fieldSchema - The Zod schema for the field being prompted.
 * @param key - The field name, used in the prompt message.
 * @returns The value entered by the user.
 */
export const promptForZodField = async (
  fieldSchema: z.ZodType,
  key: string,
): Promise<unknown> => {
  const message = (fieldSchema.meta()?.description ?? `Enter value for '${key}'`) + ':';

  let defaultValue: unknown;
  let schema: z.ZodType = fieldSchema;

  const validate = async <T>(value: T) => {
    const result = await fieldSchema.safeParseAsync(value);
    return result.success ? true : result.error?.issues.reduce((acc, v) => acc + v.message + EOL, '')
  }

  if (fieldSchema instanceof z.ZodDefault) {
    defaultValue = fieldSchema.parse(undefined);
    schema = fieldSchema.unwrap() as z.ZodType;
  }

  if (schema instanceof z.ZodNumber) {
    return CLI.promptNumber({
      message,
      defaultValue: defaultValue as number | undefined,
      required: true,
      validate: (value) => validate<number | undefined>(value)
    });
  }

  if (schema instanceof z.ZodBoolean) {
    return CLI.promptBoolean(message);
  }

  if (schema instanceof z.ZodEnum) {
    const options = schema.options as string[];
    return CLI.promptSelect({
      message,
      choices: options.map((o) => ({ name: o, value: o })),
      defaultValue: defaultValue as string | undefined,
    });
  }

  if (schema instanceof z.ZodArray) {
    const arrayValidate = <T = string>(value: T): Promise<string | true> => {
      return validate([value])
    }

    if (schema.element instanceof z.ZodNumber) {
      return CLI.promptArrayOfNumber({
        message,
        validate: arrayValidate<number>,
      });
    }

    return CLI.promptArray({
      message,
      validate: arrayValidate<string>,
    });
  }

  /* @todo add support
  if (schema instanceof z.ZodObject) {
    return CLI.promptObject({
      message,
      defaultValue: defaultValue as string | undefined,
      validate : (value) => validate<string>(value)
    });
  }
  */

  // Fallback: treat as string and let Zod validate on set
  return CLI.promptInput({
    message,
    defaultValue: defaultValue as string | undefined,
    required: true,
    validate: (value) => validate<string>(value)
  });
};

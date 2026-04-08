import chalk from 'chalk';
import boxen from 'boxen';
import ora, { type Ora } from 'ora';
import { program } from 'commander';
import {
  confirm,
  editor,
  input,
  number,
  password,
  search,
  select,
} from '@inquirer/prompts';
import type {
  PromptConfirm,
  PromptInput,
  PromptNumber,
  PromptPassword,
  PromptSearch,
  PromptSearchChoices,
  PromptSelect,
  PromptObject,
  PromptArray,
  FormatValue,
  BoxedMessage,
  BoxedMessagePrivate,
} from '@climbr/core/types/cli.js';

/**
 * CLI utility class for handling console input/output operations.
 * Wraps ora, chalk, boxen and @inquirer/prompts for consistent UX across all commands.
 */
export default class CliUtils {
  private static spinner: Ora | null = null;

  static startSpinner(text: string): void {
    this.spinner = ora({ text, color: 'blue', spinner: 'dots' }).start();
  }

  static stopSpinner(success: boolean = true, text?: string): void {
    if (this.spinner) {
      if (success) {
        this.spinner.succeed(text);
      } else {
        this.spinner.fail(text);
      }
      this.spinner = null;
    }
  }

  static showError(message: string, exit: boolean = true): void {
    console.error(chalk.red('Error:'), message);
    if (exit) {
      program.error('');
    }
  }

  static showSuccess(message: string): void {
    console.log(chalk.green('Success:'), message);
  }

  static showInfo(message: string): void {
    console.log(chalk.blue('Info:'), message);
  }

  static showDebug(message: string): void {
    if (process.env.DEBUG === 'true') {
      console.log(chalk.cyan('Debug:'), message);
    }
  }

  static showWarning(message: string): void {
    console.log(chalk.yellow('Warning:'), message);
  }

  static showBoxedDebugMessage({ message, title }: BoxedMessage): void {
    this.showBoxedMessage({ message, title, type: 'debug' });
  }

  static showBoxedSuccessMessage({ message, title }: BoxedMessage): void {
    this.showBoxedMessage({ message, title, type: 'success' });
  }

  static showBoxedErrorMessage({ message, title }: BoxedMessage): void {
    this.showBoxedMessage({ message, title, type: 'error' });
  }

  static showBoxedInfoMessage({ message, title }: BoxedMessage): void {
    this.showBoxedMessage({ message, title, type: 'info' });
  }

  private static showBoxedMessage({
    message,
    title,
    type,
  }: BoxedMessagePrivate): void {
    let borderColor;
    switch (type) {
      case 'success':
        borderColor = 'green';
        break;
      case 'error':
        borderColor = 'red';
        break;
      case 'warning':
        borderColor = 'yellow';
        break;
      case 'debug':
        borderColor = 'cyan';
        break;
      default:
        borderColor = 'blue';
        break;
    }
    console.log(
      boxen(message, {
        title,
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor,
      }),
    );
  }

  static formatValue({ value, maxLength = 50 }: FormatValue): string {
    if (value === undefined || value === null) {
      return chalk.gray('(not set)');
    }
    const stringValue =
      typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);
    return stringValue.length > maxLength
      ? `${stringValue.substring(0, maxLength)}...`
      : stringValue;
  }

  static async promptInput({
    message,
    required,
    defaultValue,
    validate,
  }: PromptInput): Promise<string> {
    const answer = await input({
      message,
      required,
      default: defaultValue,
      validate,
    });
    return answer.trim();
  }

  static async promptSelect<T>({
    message,
    defaultValue,
    choices,
  }: PromptSelect<T>): Promise<T> {
    return select({ message, default: defaultValue, choices });
  }

  static async promptSearchChoices({
    message,
    choices,
    validate,
  }: PromptSearchChoices): Promise<string> {
    return search({
      message,
      source: (term) => choices.filter((c) => c.value.includes(term || '')),
      validate,
    });
  }

  static async promptBoolean(message: string): Promise<boolean> {
    return CliUtils.promptSelect<boolean>({
      message,
      choices: [
        { name: 'True', value: true },
        { name: 'False', value: false },
      ],
    });
  }

  static async promptPassword({
    message,
    validate,
  }: PromptPassword): Promise<string> {
    return password({ message, mask: true, validate });
  }

  static async promptNumber({
    message,
    min,
    max,
    step,
    required,
    defaultValue,
    validate = (value: unknown) => {
      if (!value) return 'Please enter a number';
      if (!Number.isInteger(value)) return 'Please enter a valid number';
      return true;
    },
  }: PromptNumber): Promise<number | undefined> {
    return number({
      message,
      min,
      max,
      step,
      required,
      default: defaultValue,
      validate,
    });
  }

  static async promptConfirm({
    message,
    defaultValue,
  }: PromptConfirm): Promise<boolean> {
    return confirm({ message, default: defaultValue });
  }

  static async promptSearch<T>({
    message,
    source,
    validate,
  }: PromptSearch<T>): Promise<T> {
    return search({ message, source, validate });
  }

  static async promptObject({
    message,
    defaultValue,
    validate,
  }: PromptObject): Promise<object> {
    const answer = await editor({
      message,
      default: defaultValue,
      postfix: '.json',
      validate: (value) => {
        try {
          JSON.parse(value);
        } catch {
          return 'Invalid JSON format';
        }
        return validate ? validate(value) : true;
      },
    });

    try {
      return JSON.parse(answer) as object;
    } catch (error) {
      console.debug(error);
      return {};
    }
  }

  static async promptArray({
    message,
    validate,
  }: PromptArray): Promise<string[]> {
    const collectInputs = async (inputs: string[] = []): Promise<string[]> => {
      const answer = await input({
        message: `${message} (To stop adding elements, submit an empty value)`,
        validate,
      });
      if (answer.trim() === '') return inputs;
      return collectInputs([...inputs, answer]);
    };
    return collectInputs();
  }
}

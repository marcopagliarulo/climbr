import Configstore from 'configstore';
import type {
  ConfigDefinitionSet,
  ConfigDefinition,
  ConfigSchema,
} from '@climbr/core/types/config.js';

/**
 * ConfigStoreService handles storing and retrieving configuration.
 */
export default class ConfigStoreService {
  private store: Configstore;

  private schema: ConfigSchema;

  constructor(storeName: string) {
    this.store = new Configstore(storeName);
    this.schema = { commands: {} };
  }

  /**
   * Initialise the service with a config schema.
   */
  init(schema: ConfigSchema): void {
    this.schema = schema;
  }

  /**
   * Get the value of a configuration key for a specific command.
   * @param {string} config.command - The command name.
   * @param {string} config.key - The configuration key to retrieve.
   * @returns {string | number | boolean | object} The value of the configuration key, or its default value if not set.
   */
  public get({
    command,
    key,
  }: {
    command: string;
    key: string;
  }): unknown {
    const storeKey = `commands.${command}.${key}`;
    const value = this.store.get(storeKey);

    if (value === undefined) {
      const definition = this.getConfigDefinition({ command, key });
      if (definition?.default !== undefined) return definition.default;
    }
    return value;
  }

  /**
   * Set the value of a configuration key for a specific command.
   * @template T
   * @param {string} config.command - The command name.
   * @param {string} config.key - The configuration key to set.
   * @param {T} config.value - The value to set for the configuration key.
   */
  public set<T>({
    command,
    key,
    value,
  }: {
    command?: string;
    key: string;
    value: T;
  }): void {
    const storeKey = `commands.${command}.${key}`;
    this.store.set(storeKey, value);
  }

  /**
   * Delete a configuration key for a specific command.
   * @param {string} config.command - The command name.
   * @param {string} config.key - The configuration key to delete.
   */
  public delete({
    command,
    key,
  }: {
    command: string;
    key: string;
  }): void {
    const storeKey = `commands.${command}.${key}`;
    this.store.delete(storeKey);
  }

  /**
   * Get the names of all available commands in the configuration.
   * @returns {string[]} An array of command names.
   */
  public getConfigCommandNames(): string[] {
    return Object.keys(this.schema.commands);
  }

  /**
   * Get the keys of the configuration for a specific command.
   * @param {string} command - The command name.
   * @returns {string[]} An array of configuration keys.
   */
  public getConfigKeysNames(command: string): string[] {
    const keys = this.schema.commands[command] ?? {};
    return Object.keys(keys);
  }

  /**
   * Get the definition of a specific configuration key for a command.
   * @param {string} config.command - The command name.
   * @param {string} config.key - The configuration key to retrieve the definition for.
   * @returns {ConfigDefinition | null} The configuration definition.
   */
  public getConfigDefinition({
    command,
    key,
  }: {
    command: string;
    key: string;
  }): ConfigDefinition | null {
    const commandSchema = this.schema.commands[command];
    if (!commandSchema) return null;
    return commandSchema[key] ?? null;
  }

  /**
   * Get the entire configuration schema.
   * @returns {object} The configuration schema.
   */
  public getConfigSchema(): ConfigSchema {
    return this.schema;
  }

  /**
   * Get the configuration schema for a specific command.
   * @param {string} command - The command name.
   * @returns {ConfigDefinitionSet | null} The configuration schema for the command.
   */
  public getCommandConfigSchema(command: string): ConfigDefinitionSet | null {
    return this.schema.commands[command] ?? null;
  }

  /**
   * Validate if a specific command name exists.
   * @param {string} command - The command name.
   * @returns {boolean} Whatever if the command exists or not.
   */
  public validateCommandName(command: string): boolean {
    return this.getConfigCommandNames().includes(command);
  }

  /**
   * Validate if a specific command config key exists.
   * @param {string} command - The command name.
   * @param {string} configKey - The config key.
   * @returns {boolean} Whatever if the command exists or not.
   */
  public validateConfigKey(command: string, configKey: string): boolean {
    return this.getConfigKeysNames(command).includes(configKey);
  }
}

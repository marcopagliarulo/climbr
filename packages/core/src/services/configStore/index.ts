import Configstore from 'configstore';
import { z } from 'zod';
import type { ConfigSchema, ConfigRegistry } from '../../types/config.js';

/**
 * ConfigStoreService handles storing, retrieving, and validating configuration.
 *
 * Schemas are Zod objects. Validation happens at write time via `set()`,
 * so values on disk are always guaranteed to match the schema.
 */
export default class ConfigStoreService {
  private static instance: ConfigStoreService | null;

  private store: Configstore;

  private registry: ConfigRegistry;

  public constructor(storeName: string) {
    this.store = new Configstore(storeName);
    this.registry = {};
  }

  /**
   * Register a Zod schema for a given scope.
   * Called by the framework during config discovery.
   * @param scope - `'global'` or a command name.
   * @param schema - The Zod schema for this scope.
   */
  public registerSchema(scope: string, schema: ConfigSchema): void {
    this.registry[scope] = schema;
  }

  /**
   * Create (or return the existing) singleton instance.
   * @param name - The store name used to namespace config on disk.
   * @returns The singleton `ConfigStoreService` instance.
   */
  static initialize(name: string): ConfigStoreService {
    if (!ConfigStoreService.instance) {
      ConfigStoreService.instance = new ConfigStoreService(name);
    }
    return ConfigStoreService.instance;
  }

  /**
   * Return the singleton instance, optionally initializing it if a name is given.
   * Returns `null` if the store has not been initialized yet and no name is provided.
   * @param name - Store name passed on first call if the instance doesn't exist yet.
   * @returns The singleton instance, or `null` if not yet initialized.
   */
  public static getInstance(name?: string): ConfigStoreService | null {
    if (!ConfigStoreService.instance) {
      if (name) {
        try {
          ConfigStoreService.instance = new ConfigStoreService(name);
        } catch (error) {
          ConfigStoreService.instance = null;
          throw new Error('Failed to initialize ConfigStoreService', { cause: error });
        }
      }
    }
    return ConfigStoreService.instance;
  }

  /**
   * Return all configuration values for a scope, merging stored values with Zod defaults.
   * @param scope - `'global'` or a command name.
   * @returns The parsed config object for the scope.
   */
  public getAll<T extends ConfigSchema>(scope: string): z.infer<T> {
    const schema = this.registry[scope];
    if (!schema) throw new Error(`No schema registered for scope: '${scope}'`);
    const stored = this.store.get(scope) ?? {};
    return schema.parse(stored) as z.infer<T>;
  }

  /**
   * Return a single configuration value, falling back to the Zod default if unset.
   * @param scope - `'global'` or a command name.
   * @param key - The configuration key.
   * @returns The stored or default value, or `undefined` if neither exists.
   */
  public get(scope: string, key: string): unknown {
    if (this.hasScope(scope) && this.hasKey(scope, key)) {
      const value = this.store.get([scope, key].join('.'));
      if (typeof value !== 'undefined') {
        return value;
      }
    }

    // Fall back to Zod default
    const schema = this.registry[scope];
    if (!schema) return undefined;
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const fieldSchema = shape[key];
    if (!fieldSchema) return undefined;

    const defaultResult = fieldSchema.safeParse(undefined);
    return defaultResult.success ? defaultResult.data : undefined;
  }

  /**
   * Persist a configuration value after validating it against the registered Zod schema.
   * Throws if the scope/key doesn't exist or the value fails validation.
   * @param scope - `'global'` or a command name.
   * @param key - The configuration key.
   * @param value - The value to set.
   */
  public set(scope: string, key: string, value: unknown): void {
    const schema = this.registry[scope];
    if (!schema) throw new Error(`No schema registered for scope: '${scope}'`);

    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const fieldSchema = shape[key];
    if (!fieldSchema)
      throw new Error(`Key '${key}' does not exist in scope '${scope}'`);

    try {
      const result = fieldSchema.safeParse(value);
      const current = this.store.get(scope) ?? {};
      this.store.set(scope, { ...current, [key]: result.data });
    } catch (error: unknown) {
      const messages = [];
      if (error instanceof z.ZodError) {
        error.issues.forEach((issue: z.core.$ZodIssue) => {
          messages.push(issue.message);
        });
      } else if (error instanceof Error) {
        messages.push(error.message);
      }

      throw new Error(`Invalid value for '${key}': ${messages.join('\n')}`, {
        cause: error,
      });
    }
  }

  /**
   * Delete a single configuration key from a scope.
   * @param scope - `'global'` or a command name.
   * @param key - The configuration key to delete.
   */
  public delete(scope: string, key: string): void {
    const current = this.store.get<ConfigSchema>(scope) ?? { key: '' };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _, ...rest } = current as { [key: string]: unknown };
    this.store.set(scope, rest);
  }

  /**
   * Return all registered scope names.
   * @returns Array of scope names.
   */
  public getScopes(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * Return all key names defined in a scope's schema.
   * @param scope - `'global'` or a command name.
   * @returns Array of key names.
   */
  public getKeys(scope: string): string[] {
    const schema = this.registry[scope];
    if (!schema) return [];
    return Object.keys(schema.shape);
  }

  /**
   * Return the Zod schema for a specific field in a scope.
   * Used by the config command to determine the appropriate prompt type.
   * @param scope - `'global'` or a command name.
   * @param key - The configuration key.
   * @returns The Zod schema for the field, or `undefined` if the scope/key doesn't exist.
   */
  public getFieldSchema(scope: string, key: string): z.ZodTypeAny | undefined {
    const schema = this.registry[scope];
    if (!schema) return undefined;
    return (schema.shape as Record<string, z.ZodTypeAny>)[key];
  }

  /**
   * Return `true` if the scope has a registered schema.
   * @param scope - The scope name to check.
   * @returns `true` if the scope is registered.
   */
  public hasScope(scope: string): boolean {
    return scope in this.registry;
  }

  /**
   * Return `true` if the key is defined in the scope's schema.
   * @param scope - The scope name.
   * @param key - The key to check.
   * @returns `true` if the key exists in the scope.
   */
  public hasKey(scope: string, key: string): boolean {
    return this.getKeys(scope).includes(key);
  }

  /**
   * Throw if the scope is not registered.
   * @param scope - The scope to validate.
   */
  public validateScope(scope: string): void {
    if (!this.hasScope(scope)) {
      const available = this.getScopes().join(', ');
      throw new Error(
        `Invalid configurable scope: '${scope}'. Available: ${available}`,
      );
    }
  }

  /**
   * Throw if the key does not exist in the scope's schema.
   * @param scope - The scope name.
   * @param key - The key to validate.
   */
  public validateConfigKey(scope: string, key: string): void {
    if (this.hasScope(scope)) {
      if (!this.hasKey(scope, key)) {
        throw new Error(
          `The config key '${key}' for command '${scope}' does not exist.`,
        );
      }
    }
  }
}

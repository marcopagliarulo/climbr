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
   * Called by the framework during command discovery.
   * @param {string} scope - 'global' or a command name.
   * @param {ConfigSchema} schema - The Zod schema for this scope.
   */
  public registerSchema(scope: string, schema: ConfigSchema): void {
    this.registry[scope] = schema;
  }

  static initialize(name: string): ConfigStoreService {
    if (!ConfigStoreService.instance) {
      ConfigStoreService.instance = new ConfigStoreService(name);
    }
    return ConfigStoreService.instance;
  }

  /**
   * Get the singleton instance of ConfigStoreService.
   * @returns {ConfigStoreService} The initialized instance of ConfigStoreService.
   */
  public static getInstance(name?: string): ConfigStoreService | null {
    if (!ConfigStoreService.instance) {
      if (name) {
        try {
          ConfigStoreService.instance = new ConfigStoreService(name);
        } catch (error) {
          console.error('Failed to initialize ConfigStoreService:', error);
          ConfigStoreService.instance = null; // Reset instance on failure
          throw error; // Re-throw the error to handle it upstream
        }
      }
    }
    return ConfigStoreService.instance;
  }

  /**
   * Get the inferred TypeScript type for a scope's schema.
   * Merges stored values with Zod defaults.
   * @param {string} scope - 'global' or a command name.
   * @returns The parsed config object for this scope.
   */
  public getAll<T extends ConfigSchema>(scope: string): z.infer<T> {
    const schema = this.registry[scope];
    if (!schema) throw new Error(`No schema registered for scope: '${scope}'`);
    const stored = this.store.get(scope) ?? {};
    return schema.parse(stored) as z.infer<T>;
  }

  /**
   * Get a single configuration value for a scope/key pair.
   * Falls back to the Zod default if not set.
   * @param {string} scope - 'global' or a command name.
   * @param {string} key - The configuration key.
   * @returns The value, or undefined if not set and no default.
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
   * Set a configuration value, validating it against the registered Zod schema.
   * Throws a descriptive error if validation fails.
   * @param {string} scope - 'global' or a command name.
   * @param {string} key - The configuration key.
   * @param {unknown} value - The value to set.
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
   * @param {string} scope - 'global' or a command name.
   * @param {string} key - The configuration key to delete.
   */
  public delete(scope: string, key: string): void {
    const current = this.store.get<ConfigSchema>(scope) ?? { key: '' };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _, ...rest } = current as { [key: string]: unknown };
    this.store.set(scope, rest);
  }

  /**
   * Get all registered scope names.
   * @returns {string[]} Array of scope names.
   */
  public getScopes(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * Get all key names for a given scope.
   * @param {string} scope - 'global' or a command name.
   * @returns {string[]} Array of key names.
   */
  public getKeys(scope: string): string[] {
    const schema = this.registry[scope];
    if (!schema) return [];
    return Object.keys(schema.shape);
  }

  /**
   * Get the Zod schema for a specific field in a scope.
   * Used by the config command to determine prompt type.
   * @param {string} scope - 'global' or a command name.
   * @param {string} key - The configuration key.
   * @returns {z.ZodTypeAny | undefined} The Zod schema for the field.
   */
  public getFieldSchema(scope: string, key: string): z.ZodTypeAny | undefined {
    const schema = this.registry[scope];
    if (!schema) return undefined;
    return (schema.shape as Record<string, z.ZodTypeAny>)[key];
  }

  /**
   * Check if a scope name is registered.
   * @param {string} scope - The scope to validate.
   * @returns {boolean}
   */
  public hasScope(scope: string): boolean {
    return scope in this.registry;
  }

  /**
   * Check if a key exists within a scope.
   * @param {string} scope - The scope name.
   * @param {string} key - The key to validate.
   * @returns {boolean}
   */
  public hasKey(scope: string, key: string): boolean {
    return this.getKeys(scope).includes(key);
  }

  public validateScope(scope: string): void {
    if (!this.hasScope(scope)) {
      const available = this.getScopes().join(', ');
      throw new Error(
        `Invalid configurable scope: '${scope}'. Available: ${available}`,
      );
    }
  }

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

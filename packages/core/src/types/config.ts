import { z } from 'zod';

/**
 * A Zod schema describing a single CLI config namespace (global or per-command).
 * Consumers define their config schemas as plain Zod object schemas.
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 * export default z.object({
 *   apiUrl: z.string().url(),
 *   timeout: z.number().min(0).default(5000),
 * });
 * ```
 */
export type ConfigSchema = z.ZodObject<z.ZodRawShape>;

export type ConfigDefinition = {
  scope: string;
  schema: ConfigSchema;
};

/**
 * The inferred TypeScript type from a ConfigSchema.
 * Use this to get full type safety when reading config values.
 */
export type InferConfig<T extends ConfigSchema> = z.infer<T>;

/**
 * The internal representation of the full config registry,
 * keyed by scope name ('global' or command name).
 */
export type ConfigRegistry = Record<string, ConfigSchema>;

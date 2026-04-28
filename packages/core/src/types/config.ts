import { z } from 'zod';

type AllowedConfigValueBase =
  | z.ZodString
  | z.ZodCustomStringFormat
  | z.ZodNumber
  | z.ZodEmail
  | z.ZodUUID
  | z.ZodURL
  | z.ZodEmoji
  | z.ZodBase64
  | z.ZodBase64URL
  | z.ZodNanoID
  | z.ZodJWT
  | z.ZodCUID
  | z.ZodCUID2
  | z.ZodULID
  | z.ZodIPv4
  | z.ZodIPv6
  | z.ZodMAC
  | z.ZodCIDRv4
  | z.ZodCIDRv6
  | z.ZodISODate
  | z.ZodISOTime
  | z.ZodISODateTime
  | z.ZodISODuration
  | z.ZodBoolean
  | z.ZodEnum
  | z.ZodCodec<z.ZodString, z.ZodBoolean>
  | z.ZodArray<z.ZodString>
  | z.ZodArray<z.ZodInt>
  | z.ZodTuple

type AllowedConfigValue = AllowedConfigValueBase | z.ZodDefault<AllowedConfigValueBase>;

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
type AllowedConfigShape = Record<string, AllowedConfigValue>;
export type ConfigSchema = z.ZodObject<AllowedConfigShape>;

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

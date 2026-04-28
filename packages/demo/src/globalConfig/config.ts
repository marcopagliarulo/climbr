import { z } from '@climbr/core';
import type { ConfigDefinition } from '@climbr/core';


export default {
  scope: 'global',
  schema: z.object({
    // Strings.
    zStringMax5: z.string().max(5).meta({ description: "A string not longer than 5 character" }),
    zStringMin5: z.string().min(5),
    zStringLen5: z.string().length(5),
    zStringRegexpAZ: z.string().regex(/^[a-z]+$/),
    zStringStartaaa: z.string().startsWith('aaa'),
    zStringEndszzz: z.string().endsWith('zzz'),
    zStringIncludesText: z.string().includes('text'),
    zStringUppercase: z.string().uppercase(),
    zStringLowercase: z.string().lowercase(),
    zEmail: z.email(),
    zUuidV1: z.uuid({ version: 'v1' }),
    zUuidV2: z.uuid({ version: 'v2' }),
    zUuidV3: z.uuid({ version: 'v3' }),
    zUuidV4: z.uuid({ version: 'v4' }),
    zUuidV5: z.uuid({ version: 'v5' }),
    zUuidV6: z.uuid({ version: 'v6' }),
    zUuidV7: z.uuid({ version: 'v7' }),
    zUuidV8: z.uuid({ version: 'v8' }),
    zUrl: z.url(),
    zHttpUrl: z.httpUrl(),
    zHostname: z.hostname(),
    zEmoji: z.emoji(),
    zBase64: z.base64(),
    zBase64url: z.base64url(),
    zHex: z.hex(),
    zJwt: z.jwt(),
    zNanoid: z.nanoid(),
    zCuid: z.cuid(),
    zCuid2: z.cuid2(),
    zUlid: z.ulid(),
    zIpv4: z.ipv4(),
    zIpv6: z.ipv6(),
    zMac: z.mac(),
    zCidrv4: z.cidrv4(),
    zCidrv6: z.cidrv6(),
    zHashSha256: z.hash('sha256'),
    zHashSha1: z.hash('sha1'),
    zHashSha384: z.hash('sha384'),
    zHashSha512: z.hash('sha512'),
    zHashMd5: z.hash('md5'),
    zIsoDate: z.iso.date(),
    zIsoTime: z.iso.time(),
    zIsoDatetime: z.iso.datetime(),
    zIsoDuration: z.iso.duration(),
    // Numbers.
    zNumberGt5: z.number().gt(5),
    zNumberGte5: z.number().gte(5),
    zNumberLt5: z.number().lt(5),
    zNumberLte5: z.number().lte(5),
    zNumberPositive: z.number().positive(),
    zNumberNonNegative: z.number().nonnegative(),
    zNumberNegative: z.number().negative(),
    zNumberNonPositive: z.number().nonpositive(),
    zNumberMultiple5: z.number().multipleOf(5),
    // Integers.
    zInt: z.int(),
    zInt32: z.int32(),
    // Boolean
    zBoolean: z.boolean(),
    // Enum
    zEnum: z.enum(['Salmon', 'Tuna', 'Trout']),
    // String to boolean.
    zStrbool: z.stringbool(),
    // Array of string.
    zArrayString: z.array(z.string()),
    // Array of int.
    zArrayInt: z.array(z.int()),
    // Tuple.
    zTupleStringNumberBoolean: z.tuple([
      z.string(),
      z.number(),
      z.boolean()
    ]),
    /* @TODO Add support
    // Object.
    zObject: z.object({
      string: z.string(),
      number: z.number(),
    }),
    // Record.
    zRecord: z.record(z.string(), z.string()),
    // Map.
    zMap: z.map(z.string(), z.number()),
    // Set.
    zSet: z.set(z.number()),
    */
  }),
} as ConfigDefinition;

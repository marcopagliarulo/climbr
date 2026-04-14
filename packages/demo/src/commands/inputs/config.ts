import { z } from '@climbr/core';
import type { ConfigDefinition } from '@climbr/core';

export default {
  scope: 'inputs',
  schema: z.object({
    defaultName: z.string().default(''),
    defaultAge: z.number().min(1, 'Age must be a positive number').default(25),
    alwaysPublic: z.boolean().default(false),
    defaultRole: z
      .enum(['developer', 'designer', 'manager', 'other'])
      .default('developer'),
    defaultTags: z.array(z.string()).default([]),
    defaultMetadata: z
      .object({
        website: z.string(),
        bio: z.string(),
      })
      .default({ website: '', bio: '' }),
  }),
} as ConfigDefinition;

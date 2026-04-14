import { z } from '@climbr/core';
import type { ConfigDefinition } from '@climbr/core';

export default {
  scope: 'global',
  schema: z.object({
    globalConfig1: z.string().default(''),
    globalConfig2: z
      .number()
      .min(1, 'globalConfig2 must be a positive number')
      .default(25),
  }),
} as ConfigDefinition;

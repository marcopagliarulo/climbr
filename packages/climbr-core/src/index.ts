// Framework entry point
export { createCli } from './createCli.js';

// Services (for use in commands)
export { default as ConfigStoreService } from './services/configStore/index.js';
export { default as CacheService } from './services/cache/index.js';
export { default as CommandDiscoveryService } from './services/commandDiscovery/index.js';

// Utilities
export { default as CliUtils } from './utils/cli.js';
export { capitalize } from './utils/string.js';

// Re-export zod for convenience.
export { z } from 'zod';

// Types
export type {
  ClimbrOptions,
  ClimbrPlugin,
  ClimbrInstance,
} from './types/framework.js';
export type {
  ConfigSchema,
  InferConfig,
  ConfigRegistry
} from './types/config.js';
export type {
  InquirerChoice,
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
} from './types/cli.js';

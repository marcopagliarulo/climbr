// Framework entry point
export { createCli } from './createCli.js';

// Services (for use in commands)
export { default as ConfigStoreService } from './services/configStore/index.js';
export { default as CacheService } from './services/cache/index.js';
export { default as CommandDiscoveryService } from './services/commandDiscovery/index.js';

// Utilities
export { default as CLI } from './utils/cli.js';
export { capitalize } from './utils/string.js';

// Types
export type {
  ClimbrOptions,
  ClimbrPlugin,
  ClimbrInstance,
} from './types/framework.js';
export type {
  ConfigDefinition,
  ConfigDefinitionSet,
  ConfigSchema,
  ConfigValueType,
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

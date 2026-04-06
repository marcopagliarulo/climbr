import { Command } from 'commander';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';
import createGetCommand from '@climbr/core/commands/config/get/index.js';
import createSetCommand from '@climbr/core/commands/config/set/index.js';
import createDeleteCommand from '@climbr/core/commands/config/delete/index.js';

/**
 * Creates the built-in `config` command, wired to the ConfigStoreService.
 * Registered automatically by the framework unless disabled via `defaults.config: false`.
 *
 * Can also be used directly for manual registration:
 * @example
 * ```ts
 * import { createConfigCommand } from 'climbr-config';
 * cli.use(createConfigCommand(cli.configStore));
 * ```
 */
export function createConfigCommand(configStore: ConfigStoreService): Command {
  return new Command('config')
    .description('Manage CLI configuration')
    .addCommand(createGetCommand(configStore))
    .addCommand(createSetCommand(configStore))
    .addCommand(createDeleteCommand(configStore));
}

export { setAction } from '@climbr/core/commands/config/set/index.js';

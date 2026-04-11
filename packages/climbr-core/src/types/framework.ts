import type { Command } from 'commander';
import ConfigStoreService from '@climbr/core/services/configStore/index.js';

/**
 * Options for configuring the climbr framework instance.
 */
export interface ClimbrOptions {
  /** Display name of the CLI (used in help output). */
  name: string;

  /** Version string, e.g. from your package.json. */
  version: string;

  /** Description shown in help output. */
  description?: string;

  /**
   * Absolute path to the directory where the framework will
   * auto-discover commands. Defaults to `<cwd>/src/commands`.
   */
  commandsDir?: string;

  /**
   * Absolute path to the directory where the framework will
   * auto-discover configurations.
   */
  configDir?: string;

  /**
   * Control built-in default commands.
   * Set a key to `false` to disable it entirely.
   * Pass a Command to override it with your own implementation.
   */
  defaults?: {
    config?: false | Command;
  };

  /**
   * Name used to namespace the config store on disk.
   * Defaults to the value of `name`.
   */
  configStoreName?: string;
}

/**
 * The Climbr framework instance returned by `createCli()`.
 */
export interface ClimbrInstance {
  /**
   * Register a Commander Command plugin.
   * If a built-in command with the same name exists, it is replaced.
   */
  use(command: Command): ClimbrInstance;

  /**
   * Parse process.argv and run the CLI.
   * Call this once at the end of your bin entry point.
   */
  run(): Promise<void>;

  /**
   * Access the underlying Commander program for advanced configuration.
   */
  program: Command;

  /**
   * Access the ConfigStoreService.
   */
  configStore: ConfigStoreService;
}

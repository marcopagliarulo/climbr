import { existsSync, readdirSync } from 'fs';
import { basename, join } from 'path';
import { z } from 'zod';
import type { Command } from 'commander';
import type ConfigStoreService from '@climbr/core/services/configStore/index.js';
import type {
  ConfigSchema,
} from '@climbr/core/types/config.js';

interface CommandModule {
  [key: string]: unknown;
}

/**
 * CommandDiscoveryService handles finding and loading commands and their
 * configuration schemas from a configurable commands directory.
 *
 * Convention:
 *  - `<commandsDir>/<name>/index.js`  → exports `<name>Command(program)` function
 *  - `<commandsDir>/<name>/config.js` → exports a z.object() schema as default
 *  - globalConfigPath                 → exports a z.object() schema for the 'global' scope
 *
 * Both command loading and schema discovery are fully recursive, so nested
 * subcommand directories (e.g. sites/search/) are handled correctly.
 */
export default class CommandDiscoveryService {
  private readonly commandsDir: string;

  private readonly globalConfigPath: string | null;

  public constructor(commandsDir: string, globalConfigPath: string | null = null) {
    this.commandsDir = commandsDir;
    this.globalConfigPath = globalConfigPath;
  }

  /**
   * Discover all Zod config schemas and register them with the ConfigStoreService.
   * Traverses the full command tree recursively so nested commands with their
   * own config.js files are picked up correctly.
   * 
   * @param {ConfigStoreService} configStore - The store to register schemas into.
   */
  public async registerSchemas(configStore: ConfigStoreService): Promise<void> {
    // Register global schema
    if (this.globalConfigPath && existsSync(this.globalConfigPath)) {
      const schema = await CommandDiscoveryService.loadSchema(this.globalConfigPath);
      if (schema) configStore.registerSchema('global', schema);
    }

    if (!existsSync(this.commandsDir)) return;

    // Traverse the full directory tree — every directory that contains a config.js
    // gets its schema registered under its directory name as the scope key.
    await this.traverseCommandDirectories(this.commandsDir, async (dirPath) => {
      const configPath = join(dirPath, 'config.js');
      const schema = await CommandDiscoveryService.loadSchema(configPath);
      if (schema) {
        configStore.registerSchema(basename(dirPath), schema);
      }
    });
  }

  /**
   * Load and register all discovered commands with the given Commander program.
   * Recurses into subdirectories so nested subcommands are loaded automatically.
   * 
   * @param {Command} program - The program to register the commands with.
   * @returns {Promise<void>} A promise that resolves when all commands are loaded.
   */
  public async loadCommands(program: Command): Promise<void> {
    if (!existsSync(this.commandsDir)) {
      throw new Error(`Commands directory not found: ${this.commandsDir}`);
    }
    await this.processDirectory(this.commandsDir, program);
  }

  /**
   * Find the directory for a specific command by name.
   * Searches recursively through the full command tree.
   * 
   * @returns {string | null} The path to the command directory, or null if not found.
   */
  public findCommandDirectory(commandName: string): string | null {
    let foundPath: string | null = null;
    this.traverseCommandDirectoriesSync(this.commandsDir, (dirPath) => {
      if (basename(dirPath) === commandName) {
        foundPath = dirPath;
      }
    });
    return foundPath;
  }

  /**
   * List all command names that have a config.js/ts file.
   * @returns {string[]} An array of command names.
   */
  public listAvailableConfigs(): string[] {
    const commandNames: string[] = [];
    this.traverseCommandDirectoriesSync(this.commandsDir, (dirPath) => {
      const configPath = join(dirPath, 'config.js');
      if (existsSync(configPath)) {
        commandNames.push(basename(dirPath));
      }
    });
    return commandNames;
  }

  /**
   * Process a directory and load command files.
   * 
   * @param {string} dirPath - The path of the directory to process.
   * @param {Command} program - The program to register the commands with.
   * @returns {Promise<void>} A promise that resolves when all commands in the directory are processed.
   */
  private async processDirectory(
    dirPath: string,
    program: Command,
  ): Promise<void> {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this.processDirectory(fullPath, program);
        } else if (entry.isFile() && entry.name === 'index.js') {
          await CommandDiscoveryService.loadCommandFile(fullPath, program);
        }
      }),
    );
  }

  /**
   * Load a command file and register it with the program.
   * 
   * @param {string} filePath - The path to the command file.
   * @param {Command} program - The program to register the command with.
   * @returns {Promise<void>} A promise that resolves when the command is loaded.
   */
  private static async loadCommandFile(
    filePath: string,
    program: Command,
  ): Promise<void> {
    const commandModule = (await import(filePath)) as CommandModule;
    const command = commandModule.default;

    if (typeof command !== 'function') return;

    (command as (program: Command) => void)(program);
  }

  /**
   * Traverse all command directories recursively.
   * 
   * @param {string} dirPath - The path of the directory to traverse.
   * @param {(dirPath: string) => void} callback - A function to call for each command directory found.
   */
  private async traverseCommandDirectories(
    dirPath: string,
    callback: (dirPath: string) => Promise<void>,
  ): Promise<void> {
    if (!existsSync(dirPath)) return;
    const entries = readdirSync(dirPath, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name);
        if (!entry.isDirectory()) return;

        if (existsSync(join(fullPath, 'index.js'))) {
          await callback(fullPath);
        }

        await this.traverseCommandDirectories(fullPath, callback);
      }),
    );
  }

  /**
   * Synchronous traversal — used for find/list operations that don't need async.
   */
  private traverseCommandDirectoriesSync(
    dirPath: string,
    callback: (dirPath: string) => void,
  ): void {
    if (!existsSync(dirPath)) return;

    const entries = readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = join(dirPath, entry.name);
      if (!entry.isDirectory()) return;

      if (existsSync(join(fullPath, 'index.js'))) {
        callback(fullPath);
      }

      this.traverseCommandDirectoriesSync(fullPath, callback);
    });
  }

  /**
   * Load and validate a Zod config schema from a file path.
   * Returns null if the file doesn't exist, can't be imported, or doesn't
   * export a z.object() schema.
   */
  private static async loadSchema(configPath: string): Promise<ConfigSchema | null> {
    if (!existsSync(configPath)) return null;

    try {
      const commandModule = (await import(configPath)) as CommandModule;
      const schema = commandModule.default;
      if (schema instanceof z.ZodObject) return schema as ConfigSchema;
      console.warn(
        `Config at ${configPath} does not export a z.object() schema — skipping.`,
      );
      return null;
    } catch {
      return null;
    }
  }
}

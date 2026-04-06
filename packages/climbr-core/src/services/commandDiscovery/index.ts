import { existsSync, readdirSync, statSync } from 'fs';
import { basename, join } from 'path';
import type { Command } from 'commander';
import type {
  ConfigDefinitionSet,
  ConfigSchema,
} from '@climbr/core/types/config.js';

interface CommandModule {
  [key: string]: unknown;
}

/**
 * CommandDiscoveryService handles finding and loading commands and their
 * configuration schemas from a configurable commands directory.
 */
export default class CommandDiscoveryService {
  private commandsDir: string;

  constructor(commandsDir: string) {
    this.commandsDir = commandsDir;
  }

  /**
   * Find the directory for a specific command by name.
   * @param {string} commandName - The name of the command to find.
   * @returns {string | null} The path to the command directory, or null if not found.
   */
  private findCommandDirectory(commandName: string): string | null {
    let foundPath: string | null = null;
    this.traverseCommandDirectories(this.commandsDir, (dirPath) => {
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
    this.traverseCommandDirectories(this.commandsDir, (dirPath) => {
      const configPath = join(dirPath, 'config.js');
      if (existsSync(configPath)) {
        commandNames.push(basename(dirPath));
      }
    });
    return commandNames;
  }

  /**
   * Load the full configuration schema (per-command).
   * @returns {Promise<ConfigSchema>} The configuration schema.
   */
  public async loadConfigSchema(): Promise<ConfigSchema> {
    const configSchema: ConfigSchema = { commands: {} };

    const loadConfigFile = async (
      configPath: string,
    ): Promise<ConfigDefinitionSet | null> => {
      try {
        if (!statSync(configPath)) return null;
        const configModule = (await import(configPath)) as unknown as {
          default?: ConfigDefinitionSet;
        };
        return configModule.default ?? null;
      } catch {
        return null;
      }
    };

    // Load command-specific configurations
    if (!existsSync(this.commandsDir)) return configSchema;

    const commandDirs = readdirSync(this.commandsDir, { withFileTypes: true });
    const configs = await Promise.all(
      commandDirs
        .filter((dir) => dir.isDirectory())
        .map(async (dir) => {
          const commandName = dir.name;
          const commandConfig = await loadConfigFile(
            join(this.commandsDir, commandName, 'config.js'),
          );
          return commandConfig ? { commandName, commandConfig } : null;
        }),
    );

    configs.forEach((config) => {
      if (config) {
        configSchema.commands[config.commandName] = config.commandConfig;
      }
    });

    return configSchema;
  }

  /**
   * Load the configuration schema for a single command.
   * @param {string} commandName - The name of the command.
   * @returns {Promise<ConfigDefinitionSet | null>} The configuration schema for the command, or null if not found.
   */
  public async loadCommandConfigSchema(
    commandName: string,
  ): Promise<ConfigDefinitionSet | null> {
    const cmdPath = this.findCommandDirectory(commandName);
    if (!cmdPath) return null;

    const configPath = join(cmdPath, 'config.js');
    if (!existsSync(configPath)) return null;

    try {
      const configModule = (await import(configPath)) as unknown as {
        default?: ConfigDefinitionSet;
      };
      return configModule.default ?? null;
    } catch (error) {
      console.error(
        `Error loading config for ${commandName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Load and register all discovered commands with the given Commander program.
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
   * Process a directory and load command files.
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
   * @param {string} filePath - The path to the command file.
   * @param {Command} program - The program to register the command with.
   * @returns {Promise<void>} A promise that resolves when the command is loaded.
   */
  private static async loadCommandFile(
    filePath: string,
    program: Command,
  ): Promise<void> {
    const commandModule = (await import(filePath)) as CommandModule;
    const commandName = basename(join(filePath, '..'));

    const exportKey = `${commandName}Command`;
    if (typeof commandModule[exportKey] !== 'function') return;
    const commandFn = commandModule[exportKey];

    (commandFn as (program: Command) => void)(program);
  }

  /**
   * Traverse all command directories recursively.
   * @param {string} dirPath - The path of the directory to traverse.
   * @param {(dirPath: string) => void} callback - A function to call for each command directory found.
   */
  private traverseCommandDirectories(
    dirPath: string,
    callback: (dirPath: string) => void,
  ): void {
    if (!existsSync(dirPath)) return;
    const entries = readdirSync(dirPath, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (existsSync(join(fullPath, 'index.js'))) {
          callback(fullPath);
        }
        this.traverseCommandDirectories(fullPath, callback);
      }
    });
  }
}

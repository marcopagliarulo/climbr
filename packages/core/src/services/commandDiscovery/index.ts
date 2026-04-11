import { existsSync } from 'node:fs';
import { Command } from 'commander';
import type { jsModule } from '../../types/generic.js';
import BaseAutoDiscovery from '../baseAutoDIscovery/index.js';

/**
 * CommandDiscoveryService handles finding and loading commands and their
 * configuration schemas from a configurable commands directory.
 *
 * Convention:
 *  - `<commandsDir>/<name>/command.js/ts`  → exports default function
 *
 * Command discovery is fully recursive, so nested
 * subcommand directories (e.g. sites/search/) are handled correctly.
 */
export default class CommandDiscoveryService extends BaseAutoDiscovery {

  private readonly commandsDir: string;

  public constructor(commandsDir: string) {
    super();
    this.ACCEPTED_FILES = [
      'command.js',
      'command.ts'
    ];
    this.commandsDir = commandsDir;
  }


  /**
   * Discover all Zod config schemas and register them with the ConfigStoreService.
   * Traverses the full command tree recursively so nested commands with their
   * own config.js files are picked up correctly.
   * 
   * @param {ConfigStoreService} configStore - The store to register schemas into.
   */
  public async discover(program: Command): Promise<void> {

    if (!existsSync(this.commandsDir)) return;

    // Traverse the full directory tree — every directory that contains a config.js
    // gets its schema registered under its directory name as the scope key.
    await this.traverseDirectories(this.commandsDir, async (configPath) => {
      await this.loadCommandFile(configPath, program);
    });
  }

  /**
   * Load a command file and register it with the program.
   * 
   * @param {string} filePath - The path to the command file.
   * @param {Command} program - The program to register the command with.
   * @returns {Promise<void>} A promise that resolves when the command is loaded.
   */
  private async loadCommandFile(
    filePath: string,
    program: Command,
  ): Promise<boolean> {
    const commandModule = (await import(filePath)) as jsModule;
    const defineCommand = commandModule.default;

    if (typeof defineCommand !== 'function') return false;

    const newCommand = (defineCommand as () => unknown)();
    if (newCommand instanceof Command) {
      const existing = program.commands.filter(c => c.name() === newCommand.name());

      if (!existing.length) {
        program.addCommand(newCommand);
        return true;
      }
    }
    return false;
  }

}

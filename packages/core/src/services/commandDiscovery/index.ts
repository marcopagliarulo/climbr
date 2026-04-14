import { existsSync } from 'node:fs';
import { Command } from 'commander';
import type { jsModule } from '../../types/generic.js';
import BaseAutoDiscovery from '../baseAutoDIscovery/index.js';

/**
 * CommandDiscoveryService handles finding and loading commands from a
 * configurable commands directory and registering them with Commander.
 *
 * Convention:
 *  - `<commandsDir>/<name>/command.js/ts`  → exports a default function returning a `Command`
 *
 * Command discovery is fully recursive, so nested
 * subcommand directories (e.g. sites/search/) are handled correctly.
 */
export default class CommandDiscoveryService extends BaseAutoDiscovery {
  private readonly commandsDir: string;

  public constructor(commandsDir: string) {
    super();
    this.ACCEPTED_FILES = ['command.js', 'command.ts'];
    this.commandsDir = commandsDir;
  }

  /**
   * Discover all command files and register them with the Commander program.
   * Traverses the full command tree recursively so nested subcommand directories
   * are picked up correctly.
   *
   * @param program - The Commander program to register commands into.
   * @returns A promise that resolves when all command files have been processed.
   */
  public async discover(program: Command): Promise<void> {
    if (!existsSync(this.commandsDir)) return;

    await this.traverseDirectories(this.commandsDir, async (configPath) => {
      await this.loadCommandFile(configPath, program);
    });
  }

  private async loadCommandFile(
    filePath: string,
    program: Command,
  ): Promise<boolean> {
    const commandModule = (await import(filePath)) as jsModule;
    const defineCommand = commandModule.default;

    if (typeof defineCommand !== 'function') return false;

    const newCommand = (defineCommand as () => unknown)();
    if (newCommand instanceof Command) {
      const existing = program.commands.filter(
        (c) => c.name() === newCommand.name(),
      );

      if (!existing.length) {
        program.addCommand(newCommand);
        return true;
      }
    }
    return false;
  }
}

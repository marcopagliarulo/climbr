import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

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
export default abstract class BaseAutoDiscovery {
  protected ACCEPTED_FILES: string[] = [];

  public constructor() {}

  /**
   * Verify if the filename is an accepted filename.
   * @param {string} name - The filename to check.
   * @param {string[]} accepted - Array of accepted filenames.
   * @returns {boolean} If the filename is valid or not.
   */
  private acceptedFile(name: string, accepted: string[]): boolean {
    return accepted.includes(name)
  }

  /**
   * Traverse all command directories recursively.
   * 
   * @param {string} dirPath - The path of the directory to traverse.
   * @param {(dirPath: string) => void} callback - A function to call for each command directory found.
   */
  protected async traverseDirectories(
    dirPath: string,
    callback: (dirPath: string) => Promise<void>,
  ): Promise<void> {
    if (!existsSync(dirPath)) return;
    const entries = readdirSync(dirPath, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this.traverseDirectories(fullPath, callback);
        }
        else if (entry.isFile() && this.acceptedFile(entry.name, this.ACCEPTED_FILES)) {
          await callback(fullPath);
        }
      }),
    );
  }

}

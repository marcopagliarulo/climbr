import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Base class for filesystem-based auto-discovery.
 * Subclasses set `ACCEPTED_FILES` to control which filenames trigger the callback
 * during recursive directory traversal.
 */
export default abstract class BaseAutoDiscovery {
  protected ACCEPTED_FILES: string[] = [];

  public constructor() {}

  private acceptedFile(name: string, accepted: string[]): boolean {
    return accepted.includes(name);
  }

  /**
   * Traverse a directory tree recursively, invoking the callback for each accepted file found.
   *
   * @param dirPath - The root directory to start traversal from.
   * @param callback - Called with the full path of each accepted file.
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
        } else if (
          entry.isFile() &&
          this.acceptedFile(entry.name, this.ACCEPTED_FILES)
        ) {
          await callback(fullPath);
        }
      }),
    );
  }
}

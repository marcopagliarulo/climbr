import { existsSync } from 'node:fs';
import BaseAutoDiscovery from '../baseAutoDIscovery/index.js';
import type ConfigStoreService from '../configStore/index.js';
import type {
  ConfigDefinition,
} from '../../types/config.js';
import type { jsModule } from '../../types/generic.js';

/**
 * ConfigDiscoveryService handles finding and loading 
 * configuration schemas from a configurable commands directory
 * and global config directory if provided. 
 *
 * Convention:
 *  - `<commandsDir>/<name>/index.js`  → exports `<name>Command(program)` function
 *  - `<commandsDir>/<name>/config.js` → exports a z.object() schema as default
 *  - globalConfigPath                 → exports a z.object() schema for the 'global' scope
 *
 * Both command loading and schema discovery are fully recursive, so nested
 * subcommand directories (e.g. sites/search/) are handled correctly.
 */
export default class ConfigDiscoveryService extends BaseAutoDiscovery{
  private readonly configDir: string | null;
  private readonly commandsDir: string;

  public constructor(commandsDir: string, configDir: string | null = null) {
    super();
    this.ACCEPTED_FILES = [
      'config.js',
      'config.ts'
    ];
    this.commandsDir = commandsDir;
    this.configDir = configDir;
  }

  /**
   * Discover all Zod config schemas and register them with the ConfigStoreService.
   * Traverses the full command tree recursively so nested commands with their
   * own config.js files are picked up correctly.
   * 
   * @param {ConfigStoreService} configStore - The store to register schemas into.
   */
  public async discover(configStore: ConfigStoreService): Promise<void> {
    const discoveryDirectories = [
      (this.configDir && existsSync(this.configDir)) ? this.configDir : '',
      existsSync(this.commandsDir) ? this.commandsDir : '',
    ];

    discoveryDirectories.filter(Boolean).forEach(async (dir: string) => {
      // Traverse the full directory tree — every directory that contains a config.js
      // gets its schema registered under its directory name as the scope key.
      await this.traverseDirectories(dir, async (configPath) => {
        const definition = await this.loadDefinition(configPath);
        if (definition) {
          configStore.registerSchema(definition.scope, definition.schema);
        }
      });

    });

  }

  /**
   * List all command names that have a config.js/ts file.
   * @returns {string[]} An array of command names.
   */
  public listAvailableConfigs(): string[] {
    return [];
  }
  
  /**
   * Load and validate a Zod config schema from a file path.
   * Returns null if the file doesn't exist, can't be imported, or doesn't
   * export a z.object() schema.
   */
  private async loadDefinition(configPath: string): Promise<ConfigDefinition | null> {
    if (!existsSync(configPath)) {
      return null;
    }
    try {
      const configModule = (await import(configPath)) as jsModule;
      const definition = configModule.default as ConfigDefinition;
      if (definition.scope && definition.schema) return definition ;
      console.warn(
        `Config at ${configPath} does not export a z.object() schema — skipping.`,
      );
      return null;
    } catch {
      return null;
    }
  }
}

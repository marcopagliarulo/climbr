import fs from 'fs';
import path from 'path';

interface cacheJson {
  expiry: number;
  data: unknown;
}

/**
 * Cache service for managing temporary data storage.
 * Provides methods to set, get, and clear cached data with expiration handling.
 */
export default class CacheService {
  private cacheDir: string;

  constructor(cacheDir: string = path.join(process.cwd(), '.cache')) {
    this.cacheDir = cacheDir;
  }

  /**
   * Get the file path for a specific cache key.
   * @param {string} key - The cache key.
   * @returns {string} The file path for the cache file.
   */
  private getCacheFile(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * Retrieve cached data for a specific key.
   * If the cache has expired or does not exist, returns `null`.
   * @template T
   * @param {string} key - The cache key.
   * @returns {T | null} The cached data, or `null` if not found or expired.
   */
  get<T>(key: string): T | null {
    const cacheFile = this.getCacheFile(key);
    if (!fs.existsSync(cacheFile)) return null;

    const cacheData = JSON.parse(
      fs.readFileSync(cacheFile, 'utf-8'),
    ) as cacheJson;
    if (Date.now() > cacheData.expiry) {
      // Remove expired cache.
      fs.unlinkSync(cacheFile);
      return null;
    }
    return cacheData.data as T;
  }

  /**
   * Store data in the cache with a time-to-live (TTL).
   * @template T
   * @param {string} key - The cache key.
   * @param {T} data - The data to cache.
   * @param {number} ttl - The time-to-live for the cache in seconds.
   * @returns {void} A promise that resolves when the data is cached.
   */
  set<T>(key: string, data: T, ttl: number): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    fs.writeFileSync(
      this.getCacheFile(key),
      JSON.stringify({ data, expiry: Date.now() + ttl * 1000 }),
    );
  }

  /**
   * Clear a specific cache entry by key.
   * @param {string} key - The cache key to clear.
   * @returns {void} A promise that resolves when the cache is cleared.
   */
  clear(key: string): void {
    const cacheFile = this.getCacheFile(key);
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  }

  /**
   * Clear all cached data.
   * Deletes the entire cache directory and its contents.
   * @returns {void} A promise that resolves when all cache is cleared.
   */
  clearAll(): void {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
    }
  }
}

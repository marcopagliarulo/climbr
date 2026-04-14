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

  private getCacheFile(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * Retrieve cached data for a specific key.
   * Returns `null` if the entry does not exist or has expired.
   * @param key - The cache key.
   * @returns The cached data, or `null` if not found or expired.
   */
  get<T>(key: string): T | null {
    const cacheFile = this.getCacheFile(key);
    if (!fs.existsSync(cacheFile)) return null;

    const cacheData = JSON.parse(
      fs.readFileSync(cacheFile, 'utf-8'),
    ) as cacheJson;
    if (cacheData.expiry != -1 && Date.now() > cacheData.expiry) {
      // Remove expired cache.
      fs.unlinkSync(cacheFile);
      return null;
    }
    return cacheData.data as T;
  }

  /**
   * Store data in the cache with a time-to-live (TTL).
   * Pass `ttl = -1` to cache indefinitely.
   * @param key - The cache key.
   * @param data - The data to cache.
   * @param ttl - Time-to-live in seconds, or `-1` for no expiry.
   */
  set<T>(key: string, data: T, ttl: number): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    fs.writeFileSync(
      this.getCacheFile(key),
      JSON.stringify({
        data,
        expiry: ttl != -1 ? Date.now() + ttl * 1000 : -1,
      }),
    );
  }

  /**
   * Delete a specific cache entry by key. No-op if the entry does not exist.
   * @param key - The cache key to delete.
   */
  clear(key: string): void {
    const cacheFile = this.getCacheFile(key);
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  }

  /**
   * Delete all cached data by removing the entire cache directory.
   */
  clearAll(): void {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
    }
  }
}

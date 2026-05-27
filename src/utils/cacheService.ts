import redis from '../config/redis';
import { logger } from './logger';

export class CacheService {
  private readonly defaultTTL = 3600; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await redis.flushdb();
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached) {
        logger.debug(`Cache hit for key ${key}`);
        return cached;
      }

      logger.debug(`Cache miss for key ${key}`);
      const data = await fetcher();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      return fetcher();
    }
  }
}

export const cacheService = new CacheService();

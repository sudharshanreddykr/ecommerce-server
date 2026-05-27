import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Wait for the server to be ready before considering the connection usable
  enableReadyCheck: true,
  // Allow commands to queue while Redis is reconnecting instead of throwing immediately
  enableOfflineQueue: true,
  // Allow unlimited retry attempts for requests (null means no limit in ioredis)
  maxRetriesPerRequest: null,
  // Provide a short reconnect/backoff policy
  reconnectOnError: (err) => {
    // return true to trigger a reconnect attempt for transient errors
    return true;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export const connectRedis = async () => {
  try {
    await redis.ping();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export default redis;

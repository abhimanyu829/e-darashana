import Redis from 'ioredis';
import logger from './logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));

export const acquireLock = async (key: string, ttl: number = 5000): Promise<boolean> => {
  const result = await redis.set(key, 'locked', 'PX', ttl, 'NX');
  return result === 'OK';
};

export const releaseLock = async (key: string): Promise<void> => {
  await redis.del(key);
};

export default redis;

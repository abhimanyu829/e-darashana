import Redis from "ioredis";
import logger from './logger';

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

redis?.on('connect', () => logger.info('Redis connected'));
redis?.on('error', (err) => logger.error('Redis error:', err));

export const acquireLock = async (key: string, ttl: number = 5000): Promise<boolean> => {
  if (!redis) return true;
  const result = await redis?.set(key, 'locked', 'PX', ttl, 'NX');
  return result === 'OK';
};

export const releaseLock = async (key: string): Promise<void> => {
  await redis?.del(key);
};

export default redis;

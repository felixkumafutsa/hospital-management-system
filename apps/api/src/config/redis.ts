import { createClient } from 'redis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: ReturnType<typeof createClient>;

const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff: wait 1s, 2s, 4s, 8s, up to 10s
          const delay = Math.min(Math.pow(2, retries) * 1000, 10000);
          logger.warn(`Redis reconnecting... attempt ${retries}, next retry in ${delay}ms`);
          return delay;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis client connected');
    });

    redisClient.on('end', () => {
      logger.warn('Redis client disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('⚠️  Failed to connect to Redis. Continuing without Redis - some caching features will be disabled:', error);
    // Don't exit the process - allow server to start without Redis
    redisClient = null as any;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    // Return a mock client that logs warnings instead of crashing
    logger.warn('⚠️  Redis is not available - caching is disabled');
    return {
      get: async () => null,
      set: async () => {},
      del: async () => {},
      exists: async () => false,
      incr: async () => 1,
      expire: async () => {},
      setEx: async () => {},
    } as any;
  }
  return redisClient;
};

export { connectRedis, getRedisClient };
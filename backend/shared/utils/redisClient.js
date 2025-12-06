import Redis from 'ioredis'

/**
 * Redis Connection Pool Configuration
 * Optimized for high concurrency
 */
const url = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`

const client = new Redis(url, {
  // Connection Pool Settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Reconnection Strategy
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`⚠️ Redis reconnecting... attempt ${times}, delay ${delay}ms`);
    return delay;
  },
  
  // Performance Settings
  lazyConnect: false,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Connection pool (ioredis uses single connection by default)
  // For high concurrency, we rely on pipeline and batching
})

client.on('connect', () => console.log('✅ Redis client connected'))
client.on('ready', () => console.log('✅ Redis client ready'))
client.on('error', (err) => console.error('❌ Redis Client Error', err))
client.on('reconnecting', () => console.log('⚠️ Redis reconnecting...'))

export default client
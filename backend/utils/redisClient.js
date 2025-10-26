import Redis from 'ioredis'

// Create a singleton Redis client instance and export it.
// Using a singleton ensures every module that imports this file
// uses the same connection and can call get/set/del directly.
const url = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`

const client = new Redis(url)

client.on('connect', () => console.log('Redis client connected'))
client.on('ready', () => console.log('Redis client ready'))
client.on('error', (err) => console.error('Redis Client Error', err))

export default client
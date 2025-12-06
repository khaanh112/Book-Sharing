import redisClient from './redisClient.js';
import { cacheHits, cacheMisses } from './metrics.js';

/**
 * Redis Cache Utilities with Error Handling
 * All functions are hardened to gracefully handle Redis failures
 */

// Check if cache is enabled via environment variable
// CACHE_ENABLED can be: 'true', 'false', undefined
// Default: true (cache enabled by default)
const CACHE_ENABLED = process.env.CACHE_ENABLED === 'false' ? false : true;

console.log(`🔧 Cache ${CACHE_ENABLED ? 'ENABLED' : 'DISABLED'} (CACHE_ENABLED=${process.env.CACHE_ENABLED || 'undefined (default: true)'})`);

// Small helper utilities to work with JSON values in Redis
export async function getJSON(key) {
  try {
    const raw = await redisClient.get(key);
    if (!raw) {
      // Cache miss
      try { cacheMisses.inc({ key }); } catch (e) {}
      return null;
    }
    
    try {
      // metric: cache hit
      try { cacheHits.inc({ key }); } catch (e) {}
      return JSON.parse(raw);
    } catch (err) {
      // If parsing fails, return raw value
      console.warn(`Cache parse error for key ${key}:`, err.message);
      try { cacheHits.inc({ key }); } catch (e) {}
      return raw;
    }
  } catch (err) {
    // Redis connection error - fail gracefully
    console.error(`Redis getJSON error for key ${key}:`, err.message);
    try { cacheMisses.inc({ key }); } catch (e) {}
    return null;
  }
}

export async function setJSON(key, value, ttlSeconds = 300) {
  try {
    const str = JSON.stringify(value);
    if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
      await redisClient.set(key, str, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, str);
    }
  } catch (err) {
    // Best-effort: log but don't throw
    console.error(`Redis setJSON error for key ${key}:`, err.message);
  }
}

export async function del(key) {
  if (!key) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`Redis del error for key ${key}:`, err.message);
  }
}

// Delete keys matching a glob-style pattern (uses KEYS -- acceptable for small dev/staging setups)
export async function delPattern(pattern) {
  if (!pattern) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return;
    // ioredis.del accepts multiple args
    await redisClient.del(...keys);
  } catch (err) {
    console.error(`Redis delPattern error for pattern ${pattern}:`, err.message);
  }
}

// Helper: try cache hit otherwise call fetchFn and cache result
export async function getOrSetJSON(key, ttlSeconds, fetchFn) {
  // If cache is disabled, always fetch from database
  if (!CACHE_ENABLED) {
    console.log(`⚠️ Cache disabled - fetching from DB for key: ${key}`);
    try { cacheMisses.inc({ key }); } catch (e) {}
    return await fetchFn();
  }

  try {
    const cached = await getJSON(key);
    if (cached !== null) {
      // Cache hit already tracked in getJSON
      return cached;
    }
    
    // Cache miss - fetch from database
    const value = await fetchFn();
    
    // Best-effort cache set (don't fail if Redis is down)
    try {
      await setJSON(key, value, ttlSeconds);
    } catch (err) {
      console.error('Cache set error for', key, err.message || err);
    }
    
    return value;
  } catch (err) {
    // If cache check fails, still try to fetch from DB
    console.error(`Cache getOrSetJSON error for key ${key}:`, err.message);
    try { cacheMisses.inc({ key }); } catch (e) {}
    return await fetchFn();
  }
}

export default {
  getJSON,
  setJSON,
  del,
  delPattern,
  getOrSetJSON,
};

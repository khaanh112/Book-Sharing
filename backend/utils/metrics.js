import client from 'prom-client';

// Create a dedicated Registry so we can control what to expose
const register = new client.Registry();

// Add default metrics (process, node, etc.) with some labels
client.collectDefaultMetrics({ register, labels: { service: 'backend' } });

// Cache hit/miss counters
export const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['key']
});
export const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['key']
});

// Rate limit metrics
export const rateLimitBlocked = new client.Counter({
  name: 'rate_limit_blocked_total',
  help: 'Total number of requests blocked by rate limiter',
  labelNames: ['route', 'ip']
});

export const rateLimitAllowed = new client.Counter({
  name: 'rate_limit_allowed_total',
  help: 'Total number of requests allowed by rate limiter',
  labelNames: ['route']
});

register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(rateLimitBlocked);
register.registerMetric(rateLimitAllowed);

export function metricsEndpoint(req, res) {
  res.setHeader('Content-Type', register.contentType);
  register.metrics().then(m => res.send(m)).catch(err => res.status(500).send(err.message));
}

export default register;

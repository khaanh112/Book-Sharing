import client from 'prom-client';
import os from 'os';

// Create a dedicated Registry so we can control what to expose
const register = new client.Registry();

// Add default metrics (process, node, etc.) with some labels
const hostname = os.hostname();
client.collectDefaultMetrics({ 
  register, 
  labels: { 
    service: 'backend',
    instance: hostname
  } 
});

// HTTP Request metrics
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'instance']
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status', 'instance'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

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

// CQRS metrics
export const cqrsCommandExecuted = new client.Counter({
  name: 'cqrs_command_executed_total',
  help: 'Total CQRS commands executed',
  labelNames: ['command']
});

export const cqrsQueryExecuted = new client.Counter({
  name: 'cqrs_query_executed_total',
  help: 'Total CQRS queries executed',
  labelNames: ['query']
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(rateLimitBlocked);
register.registerMetric(rateLimitAllowed);
register.registerMetric(cqrsCommandExecuted);
register.registerMetric(cqrsQueryExecuted);

export function metricsEndpoint(req, res) {
  res.setHeader('Content-Type', register.contentType);
  register.metrics().then(m => res.send(m)).catch(err => res.status(500).send(err.message));
}

export default register;

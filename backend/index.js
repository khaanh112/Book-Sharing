import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './utils/redisClient.js';
import { connectDB } from './config/dbConnection.js';
import dotenv from 'dotenv';
import AuthRoutes from './routes/AuthRoutes.js';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errHandler.js';
import BookRoutes from './routes/BookRoutes.js';
import BorrowRoutes from './routes/BorrowRoutes.js';
import UserRoutes from './routes/UserRoutes.js';
import NotificationRoutes from './routes/NotificationRoutes.js';
import { scheduleDueDateNotifications } from './utils/cronJobs.js';
import { metricsEndpoint, rateLimitBlocked, rateLimitAllowed } from './utils/metrics.js';


dotenv.config();
// REDIS_URL is provided by docker-compose; ensure dotenv loads local overrides
await connectDB();
const app = express();
const PORT = process.env.PORT || 3000;

// CORS MUST be applied BEFORE rate limiter
app.use(cors({
  origin: process.env.FRONTEND_URL, // domain frontend
  credentials: true,               // cho phep gui cookie
  exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'], // Expose rate limit headers
}));

// Register metrics endpoint BEFORE rate limiter (so it's never rate limited)
app.get('/metrics', metricsEndpoint);

const RATE_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || (Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT_LIMIT) || 100;

const limiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  limit: RATE_LIMIT,
  // Use draft-6 to expose individual RateLimit-* headers
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  ipv6Subnet: Number(process.env.RATE_LIMIT_IPV6_SUBNET) || 56,
  // Use Redis store when redis client available
  // Pass the existing redis client instance to avoid the store creating its own connection
  store: new RedisStore({
    client: redisClient,
  }),
  // Skip successful requests from counting against the limit (only count errors/abuse)
  skipSuccessfulRequests: false, // set to true in production to only count failed requests
  // Skip failed requests (optional - set to true to only count successful requests)
  skipFailedRequests: false,
  // IMPORTANT: Skip rate limiting for:
  // 1. Metrics endpoint (for Prometheus scraping)
  // 2. Health check endpoint
  // 3. Any request TO /metrics regardless of source IP
  skip: (req) => {
    // Skip metrics and health endpoints
    if (req.path === '/metrics' || req.path === '/health') {
      return true;
    }
    // Skip if request is from Prometheus container (Docker internal IP)
    const prometheusIP = req.ip || req.connection?.remoteAddress || '';
    if (prometheusIP.includes('172.') || prometheusIP.includes('::ffff:172.')) {
      // Prometheus likely scraping from Docker network
      if (req.path === '/metrics') return true;
    }
    return false;
  },
  handler: (req, res) => {
    // Track blocked requests in Prometheus
    const route = req.route?.path || req.path || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    rateLimitBlocked.inc({ route, ip });
    
    // Log when limit reached
    console.log(`Rate limit reached for IP: ${ip}, route: ${route}`);
    
    // CORS headers are already set by cors middleware above
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

// Apply rate limiter only when RATE_LIMIT_ENABLED is not explicitly set to 'false'
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';
if (RATE_LIMIT_ENABLED) {
  app.use(limiter);
  console.log(`Rate limiter enabled: ${RATE_LIMIT} requests per ${RATE_WINDOW_MS}ms`);
} else {
  console.log('⚠️  Rate limiter disabled via RATE_LIMIT_ENABLED=false');
}

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL]
    }
  },
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  // Disable X-Powered-By header
  hidePoweredBy: true
}));

app.use((req, res, next) => {
  // Strict Transport Security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit JSON body size
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Track allowed requests through rate limiter (for metrics)
if (RATE_LIMIT_ENABLED) {
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      // Only increment if not blocked by rate limiter (status !== 429)
      if (res.statusCode !== 429) {
        const route = req.route?.path || req.path || 'unknown';
        rateLimitAllowed.inc({ route });
      }
      return originalSend.call(this, data);
    };
    next();
  });
}

app.use('/auth', AuthRoutes);
app.use('/users', UserRoutes);
app.use('/books', BookRoutes);
app.use('/borrows', BorrowRoutes);
app.use('/notifications', NotificationRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: 'unknown',
      database: 'unknown'
    };

    // Check Redis
    try {
      const pong = await redisClient.ping();
      health.redis = pong === 'PONG' ? 'ok' : 'fail';
    } catch (err) {
      health.redis = 'error';
      health.redisError = err.message;
    }

    // Check MongoDB (simple check)
    try {
      const mongoose = (await import('mongoose')).default;
      health.database = mongoose.connection.readyState === 1 ? 'ok' : 'disconnected';
    } catch (err) {
      health.database = 'error';
    }

    const statusCode = (health.redis === 'ok' && health.database === 'ok') ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message
    });
  }
});

// Prometheus metrics endpoint already registered before rate limiter (see line ~33)

app.use((req, res, next) => {
  res.status(404);
  next(new Error('Route not found'));
});

app.use(errorHandler);

(async () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Khởi động cron job để check due dates
    scheduleDueDateNotifications();
  });
})();


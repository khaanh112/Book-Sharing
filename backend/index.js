import express from 'express';
import os from 'os';
import cors from 'cors';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './shared/utils/redisClient.js';
import { connectDB } from './config/dbConnection.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose'; // Import mongoose để đóng kết nối sạch sẽ
import cookieParser from 'cookie-parser';
import errorHandler from './shared/middlewares/errHandler.js';
// Import from modular structure
import { authRoutes } from './modules/auth/index.js';
import { bookRoutes } from './modules/books/index.js';
import { borrowRoutes } from './modules/borrowing/index.js';
import { userRoutes } from './modules/users/index.js';
import { notificationRoutes } from './modules/notifications/index.js';
import { scheduleDueDateNotifications } from './shared/utils/cronJobs.js';
import { 
  metricsEndpoint, 
  rateLimitBlocked, 
  rateLimitAllowed,
  httpRequestsTotal,
  httpRequestDuration
} from './shared/utils/metrics.js';


dotenv.config();
// REDIS_URL is provided by docker-compose; ensure dotenv loads local overrides
await connectDB();

// Initialize CQRS Pattern
import initializeCQRS from './cqrs/bootstrap.js';
initializeCQRS();

// Initialize Event-Driven Architecture
import registerAllListeners from './shared/events/registerListeners.js';
registerAllListeners();

const app = express();

app.use((req, res, next) => {
    const serverName = os.hostname();
    // Dùng console.error để tránh bị buffer (in ra ngay lập tức)
    console.error(`👉 [${serverName}] Request: ${req.method} ${req.url}`);
    next(); 
});

const PORT = process.env.PORT || 3000;

// CORS MUST be applied BEFORE rate limiter
app.use(cors({
  origin: process.env.FRONTEND_URL, // domain frontend
  credentials: true,               // cho phep gui cookie
  exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'], // Expose rate limit headers
}));

// Register metrics endpoint BEFORE rate limiter (so it's never rate limited)
app.get('/metrics', metricsEndpoint);

const RATE_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT_LIMIT) || 100;
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

if (RATE_LIMIT_ENABLED) {
  const limiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    limit: RATE_LIMIT,
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    // QUAN TRỌNG: Sử dụng Redis Store để đồng bộ counter giữa các instances
    store: new RedisStore({
      // @ts-ignore
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    handler: (req, res) => {
      const route = req.route?.path || req.path || 'unknown';
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      rateLimitBlocked.inc({ route, ip });
      
      console.warn(`Rate limit reached for IP: ${ip}, route: ${route}`);
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
      });
    },
  });

  app.use(limiter);
  console.log(`✅ Rate limiter enabled with Redis Store: ${RATE_LIMIT} reqs / ${RATE_WINDOW_MS}ms`);

  // Middleware track allowed requests for metrics
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode !== 429) {
        const route = req.route?.path || req.path || 'unknown';
        rateLimitAllowed.inc({ route });
      }
      return originalSend.call(this, data);
    };
    next();
  });
} else {
  console.log('⚠️ Rate limiter disabled');
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

// Metrics tracking middleware - track ALL requests (must be BEFORE routes)
app.use((req, res, next) => {
  // Skip metrics endpoint itself to avoid recursion
  if (req.path === '/metrics') return next();
  
  const start = Date.now();
  const hostname = os.hostname();
  
  // Capture response - only wrap once
  const originalSend = res.send;
  const originalJson = res.json;
  
  const recordMetrics = function() {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const status = res.statusCode;
    
    // Increment HTTP request counters with instance label
    httpRequestsTotal.inc({ 
      method, 
      route, 
      status: status.toString(),
      instance: hostname 
    });
    
    // Record request duration
    httpRequestDuration.observe({ 
      method, 
      route, 
      status: status.toString(),
      instance: hostname 
    }, duration);
    
    // Track rate limit allowed requests (if rate limiting is enabled)
    if (RATE_LIMIT_ENABLED && status !== 429) {
      rateLimitAllowed.inc({ route });
    }
  };
  
  res.send = function(data) {
    recordMetrics();
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    recordMetrics();
    return originalJson.call(this, data);
  };
  
  next();
});

app.use('/auth', authRoutes); // Using modular route
app.use('/users', userRoutes); // Using modular route
app.use('/books', bookRoutes); // Using modular route
app.use('/borrows', borrowRoutes); // Using modular route
app.use('/notifications', notificationRoutes); // Using modular route

// Root endpoint - optimized with cache headers
app.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
  res.set('Content-Type', 'application/json');
  res.json({ 
    name: 'Book-Sharing API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      docs: '/api-docs'
    }
  });
});

// Health check endpoints
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    redis: 'Unknown',
    database: 'Unknown'
  };

  try {
    // Check Redis
    try {
      await redisClient.ping();
      health.redis = 'Connected';
    } catch (e) {
      health.redis = 'Disconnected';
      health.status = 'Degraded';
    }

    // Check Mongo
    const dbState = mongoose.connection.readyState; // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    health.database = dbState === 1 ? 'Connected' : 'Disconnected';
    if (dbState !== 1) health.status = 'Degraded';

    const httpCode = health.status === 'OK' ? 200 : 503;
    res.status(httpCode).json(health);
  } catch (error) {
    health.status = 'Error';
    health.error = error.message;
    res.status(503).json(health);
  }
});

// Prometheus metrics endpoint already registered before rate limiter (see line ~33)

app.use((req, res, next) => {
  res.status(404);
  next(new Error('Route not found'));
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  scheduleDueDateNotifications();
});

// Hàm xử lý tắt server an toàn
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // 1. Ngừng nhận request mới, nhưng xử lý nốt request đang chạy
  server.close(async () => {
    console.log('HTTP server closed.');

    try {
      // 2. Đóng kết nối Database
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');

      // 3. Đóng kết nối Redis (nếu cần thiết, tuỳ client configuration)
      if (redisClient.isOpen) {
          await redisClient.disconnect();
          console.log('Redis connection closed.');
      }

      console.log('Graceful shutdown completed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown sau 10s nếu server bị treo không đóng được
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Lắng nghe tín hiệu từ hệ thống/Docker
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

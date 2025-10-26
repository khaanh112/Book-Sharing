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
  handler: (req, res) => {
    // CORS headers are already set by cors middleware above
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

app.use(limiter);

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

app.use('/auth', AuthRoutes);
app.use('/users', UserRoutes);
app.use('/books', BookRoutes);
app.use('/borrows', BorrowRoutes);
app.use('/notifications', NotificationRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

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


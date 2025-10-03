import express from 'express';
import { connectDB } from './config/dbConnection.js';
import dotenv from 'dotenv';
import AuthRoutes from './routes/AuthRoutes.js';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errHandler.js';
import BookRoutes from './routes/BookRoutes.js';
import BorrowRoutes from './routes/BorrowRoutes.js';
import UserRoutes from './routes/UserRoutes.js';
import NotificationRoutes from './routes/NotificationRoutes.js';
import cors from 'cors';
import helmet from 'helmet';
import { scheduleDueDateNotifications } from './utils/cronJobs.js';


dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(cors({
  origin: process.env.FRONTEND_URL, // domain frontend
  credentials: true,               // cho phep gui cookie
}));

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Khởi động cron job để check due dates
  scheduleDueDateNotifications();
});


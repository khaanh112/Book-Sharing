import mongoose from 'mongoose';

/**
 * MongoDB Connection Pool Configuration
 * Optimized for high concurrency with multiple backend instances
 */
export const connectDB = async () => {
  const MONGODB_URL = process.env.MONGODB_URI;

  const options = {
    // Connection Pool Settings (critical for performance)
    maxPoolSize: 50,        // Max 50 connections per backend instance (3 instances = 150 total)
    minPoolSize: 10,        // Keep 10 connections ready
    maxIdleTimeMS: 30000,   // Close idle connections after 30s
    
    // Timeout Settings
    serverSelectionTimeoutMS: 5000,  // Fail fast if can't connect
    socketTimeoutMS: 45000,          // Socket timeout
    
    // Retry Settings
    retryWrites: true,
    retryReads: true,
    
    // Compression (reduce network bandwidth)
    compressors: ['zlib'],
    zlibCompressionLevel: 6,
  };

  await mongoose.connect(MONGODB_URL, options)
    .then(() => {
      console.log('✅ MongoDB Connected!');
      console.log(`📊 Connection Pool: min=${options.minPoolSize}, max=${options.maxPoolSize}`);
    })
    .catch(err => {
      console.error('❌ MongoDB Connection Error:', err);
      process.exit(1);
    });
}

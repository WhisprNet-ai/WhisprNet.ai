import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 * Uses environment variables with sensible defaults
 */
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3002'
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'user@example.com',
    password: process.env.EMAIL_PASSWORD || 'password',
    fromEmail: process.env.EMAIL_FROM || 'no-reply@whisprnet.ai',
    fromName: process.env.EMAIL_FROM_NAME || 'WhisprNet.ai'
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'whisprnet-dev-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '30d',
    cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10)
  },
  
  // Database configuration
  db: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/whisprnet'
  }
};

export default config; 
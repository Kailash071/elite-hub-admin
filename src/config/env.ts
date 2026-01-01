import dotenv from 'dotenv';
import { type EnvConfig } from '../types/env.js';

// Load environment variables
dotenv.config();

/**
 * Parse and validate environment variables
 */
function parseEnvNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function validateRequiredEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Environment configuration object with type safety and validation
 */
export const env: EnvConfig = {
  // Server Configuration
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'local',
  NODE_PORT: parseEnvNumber(process.env.NODE_PORT, 3001),
  BASE_URL: validateRequiredEnv('BASE_URL', process.env.BASE_URL),
  APP_NAME: validateRequiredEnv('APP_NAME', process.env.APP_NAME),

  // MongoDB Configuration (required)
  MONGO_DB_NAME: validateRequiredEnv('MONGO_DB_NAME', process.env.MONGO_DB_NAME),
  MONGO_DB_PORT: parseEnvNumber(process.env.MONGO_DB_PORT, 27017),
  MONGO_DB_HOST: validateRequiredEnv('MONGO_DB_HOST', process.env.MONGO_DB_HOST),
  ...(process.env.MONGO_DB_USER && { MONGO_DB_USER: process.env.MONGO_DB_USER }),
  ...(process.env.MONGO_DB_PASSWORD && { MONGO_DB_PASSWORD: process.env.MONGO_DB_PASSWORD }),

  // SMTP Configuration (optional)
  ...(process.env.SMTP_HOST && { SMTP_HOST: process.env.SMTP_HOST }),
  ...(process.env.SMTP_PORT && { SMTP_PORT: parseEnvNumber(process.env.SMTP_PORT, 587) }),
  ...(process.env.SMTP_USER && { SMTP_USER: process.env.SMTP_USER }),
  ...(process.env.SMTP_PASSWORD && { SMTP_PASSWORD: process.env.SMTP_PASSWORD }),

  // Frontend Configuration (optional)
  ...(process.env.FRONTEND_URL && { FRONTEND_URL: process.env.FRONTEND_URL }),

  // Session Configuration (optional)
  ...(process.env.SESSION_SECRET && { SESSION_SECRET: process.env.SESSION_SECRET }),

  // JWT Configuration
  JWT_SECRET: validateRequiredEnv('JWT_SECRET', process.env.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Logging
  LOG_LEVEL: (process.env.LOG_LEVEL as EnvConfig['LOG_LEVEL']) || 'info',

  // API Configuration
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  API_RATE_LIMIT: parseEnvNumber(process.env.API_RATE_LIMIT, 100),

  // Redis Configuration (optional)
  ...(process.env.REDIS_HOST && { REDIS_HOST: process.env.REDIS_HOST }),
  ...(process.env.REDIS_PORT && { REDIS_PORT: parseEnvNumber(process.env.REDIS_PORT, 6379) }),
  ...(process.env.REDIS_PASSWORD && { REDIS_PASSWORD: process.env.REDIS_PASSWORD }),

  // File Upload
  MAX_FILE_SIZE: parseEnvNumber(process.env.MAX_FILE_SIZE, 5242880), // 5MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
};

/**
 * Validate environment configuration on startup
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'BASE_URL', 'APP_NAME', 'MONGO_DB_NAME', 'MONGO_DB_HOST', 'JWT_SECRET'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy env.sample to .env and fill in the required values.'
    );
  }

  console.log(`🔧 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Server will run on port ${env.NODE_PORT}`);
  console.log(`🏠 Base URL: ${env.BASE_URL}`);
  console.log(`📱 App: ${env.APP_NAME}`);
  console.log(`🗄️  Database: MongoDB (${env.MONGO_DB_HOST}:${env.MONGO_DB_PORT}/${env.MONGO_DB_NAME})`);
}

export default env;

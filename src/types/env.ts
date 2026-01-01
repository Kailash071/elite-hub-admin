/**
 * Environment variables type definitions
 */

export interface EnvConfig {
  // Server Configuration
  NODE_ENV: 'local' | 'staging' | 'production';
  NODE_PORT: number;
  BASE_URL: string;
  APP_NAME: string;

  // MongoDB Configuration (required)
  MONGO_DB_NAME: string;
  MONGO_DB_PORT: number;
  MONGO_DB_HOST: string;
  MONGO_DB_USER?: string;
  MONGO_DB_PASSWORD?: string;

  // SMTP Configuration (optional)
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;

  // Frontend Configuration (optional)
  FRONTEND_URL?: string;

  // Session Configuration (optional)
  SESSION_SECRET?: string;

  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // CORS Configuration
  CORS_ORIGIN: string;

  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // API Configuration
  API_PREFIX: string;
  API_RATE_LIMIT: number;

  // Redis Configuration
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;

  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
}

// Helper type for environment validation
export type RequiredEnvKeys = keyof Pick<EnvConfig, 
  'NODE_ENV' | 'NODE_PORT' | 'BASE_URL' | 'APP_NAME' | 
  'MONGO_DB_NAME' | 'MONGO_DB_PORT' | 'MONGO_DB_HOST' | 'JWT_SECRET'
>;

export type OptionalEnvKeys = keyof Pick<EnvConfig, 
  'MONGO_DB_USER' | 'MONGO_DB_PASSWORD' | 'SMTP_HOST' | 'SMTP_PORT' | 
  'SMTP_USER' | 'SMTP_PASSWORD' | 'FRONTEND_URL' | 'SESSION_SECRET' |
  'REDIS_HOST' | 'REDIS_PORT' | 'REDIS_PASSWORD'
>;

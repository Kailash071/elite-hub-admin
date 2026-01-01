import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * MongoDB Database Connection (Function-based)
 */

// MongoDB connection state
let isMongoConnected = false;

/**
 * Build MongoDB URI based on environment and configuration
 */
function buildMongodbUri(): string {
  const { MONGO_DB_HOST, MONGO_DB_PORT, MONGO_DB_NAME, MONGO_DB_USER, MONGO_DB_PASSWORD, NODE_ENV } = env;

  // Construct the base URI
  let mongoUri = 'mongodb://';
  
  // Add authentication if provided
  if (MONGO_DB_USER && MONGO_DB_PASSWORD) {
    mongoUri += `${MONGO_DB_USER}:${MONGO_DB_PASSWORD}@`;
  }
  
  // Add host and port
  mongoUri += `${MONGO_DB_HOST}:${MONGO_DB_PORT}`;
  
  // Add database name with environment suffix
  let databaseName = MONGO_DB_NAME;
  if (NODE_ENV !== 'production') {
    // Add environment suffix for non-production environments
    databaseName = `${MONGO_DB_NAME}_${NODE_ENV}`;
  }
  
  mongoUri += `/${databaseName}`;
  
  console.log(`🔗 MongoDB URI constructed: ${mongoUri.replace(/\/\/.*:.*@/, '//***:***@')}`); // Hide credentials in log
  
  return mongoUri;
}

export async function connectDatabase(): Promise<void> {
  if (isMongoConnected) {
    console.log('📊 MongoDB already connected');
    return;
  }

  const mongoUri = buildMongodbUri();

  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      retryWrites: true,
      w: 'majority',
    });

    isMongoConnected = true;
    console.log('🔗 MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (error: any) => {
      console.error('❌ MongoDB connection error:', error);
      isMongoConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      isMongoConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔗 MongoDB reconnected');
      isMongoConnected = true;
    });

    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isMongoConnected = false;
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isMongoConnected) {
    console.log('📊 MongoDB already disconnected');
    return;
  }

  try {
    await mongoose.disconnect();
    isMongoConnected = false;
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
}

export function isDatabaseReady(): boolean {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

export function getDatabaseConnection() {
  return mongoose.connection;
}

export function getConnectionStatus() {
  const readyState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    isConnected: isMongoConnected,
    readyState,
    status: states[readyState] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
}

/**
 * Database Management Functions
 */

export async function initializeDatabase(): Promise<void> {
  try {
    await connectDatabase();
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export async function shutdownDatabase(): Promise<void> {
  try {
    await disconnectDatabase();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
    throw error;
  }
}

/**
 * Mongoose Models Access
 */
export { mongoose };

/**
 * Database Utility Functions
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    if (!isDatabaseReady()) {
      await connectDatabase();
    }
    
    // Test the connection with a simple ping
    await mongoose.connection.db?.admin().ping();
    console.log('🏓 Database ping successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

export async function clearDatabase(): Promise<void> {
  if (!isDatabaseReady()) {
    throw new Error('Database not connected');
  }
  
  try {
    await mongoose.connection.db?.dropDatabase();
    console.log('🗑️  Database cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    throw error;
  }
}

// Export convenient aliases
export const database = {
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  isReady: isDatabaseReady,
  getConnection: getDatabaseConnection,
  getStatus: getConnectionStatus,
  test: testDatabaseConnection,
  clear: clearDatabase,
};

// Main database object (function-based)
export const Database = {
  initialize: initializeDatabase,
  shutdown: shutdownDatabase,
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  isReady: isDatabaseReady,
  getStatus: getConnectionStatus,
  test: testDatabaseConnection,
  mongoose,
};

export default Database;
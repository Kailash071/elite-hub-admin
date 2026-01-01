import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import nunjucks from 'nunjucks';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';
import session from 'express-session';
import flash from 'connect-flash';
import fileUpload from 'express-fileupload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Express application configuration
 */
export function createExpressApp(): express.Application {
  const app = express();

  // Configure Nunjucks template engine
  const viewsPath = path.resolve(__dirname, '../views');
  const nunjucksEnv = nunjucks.configure(viewsPath, {
    autoescape: true,
    express: app,
    watch: env.NODE_ENV === 'local', // Auto-reload templates in development
    noCache: env.NODE_ENV === 'local' // Disable caching in development
  });

  // Set view engine
  app.set('view engine', 'njk');
  app.set('views', viewsPath);

  // Serve static files
  app.use('/', express.static(path.resolve(__dirname, '../public')));
  
  // Add global template variables
  nunjucksEnv.addGlobal('APP_NAME', env.APP_NAME);
  nunjucksEnv.addGlobal('NODE_ENV', env.NODE_ENV);
  nunjucksEnv.addGlobal('BASE_URL', env.BASE_URL);
  
  // Add custom filters
  nunjucksEnv.addFilter('date', function(date: Date | string, format: string = 'YYYY-MM-DD') {
    const d = new Date(date);
    if (format === 'MMM DD, YYYY') {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    return d.toISOString().split('T')[0];
  });
  
  nunjucksEnv.addFilter('number', function(value: number) {
    return new Intl.NumberFormat('en-IN').format(value);
  });
  
  nunjucksEnv.addFilter('timeAgo', function(date: Date | string) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  });
  
  nunjucksEnv.addFilter('title', function(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });
  
  nunjucksEnv.addGlobal('moment', function() {
    return { format: (format: string) => new Date().getFullYear() };
  });

  // Security middleware
  // app.use(helmet({
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'"],
  //       styleSrc: [
  //         "'self'", 
  //         "'unsafe-inline'",
  //         "https://fonts.googleapis.com",
  //         "https://fonts.gstatic.com"
  //       ],
  //       fontSrc: [
  //         "'self'",
  //         "https://fonts.googleapis.com",
  //         "https://fonts.gstatic.com"
  //       ],
  //       scriptSrc: [
  //         "'self'",
  //         "'unsafe-inline'",
  //         // Allow eval for webpack in development
  //         ...(env.NODE_ENV === 'local' ? ["'unsafe-eval'"] : [])
  //       ],
  //       connectSrc: ["'self'"],
  //       imgSrc: ["'self'", "data:", "https:"],
  //       objectSrc: ["'none'"],
  //       mediaSrc: ["'self'"],
  //       frameSrc: ["'none'"],
  //       baseUri: ["'self'"],
  //       formAction: ["'self'"],
  //       frameAncestors: ["'none'"]
  //     },
  //   },
  //   hsts: {
  //     maxAge: 31536000,
  //     includeSubDomains: true,
  //     preload: true,
  //   },
  // }));

  // CORS configuration
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.API_RATE_LIMIT, // Limit each IP to API_RATE_LIMIT requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use(limiter);

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    type: 'application/json',
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
  }));
  app.use(fileUpload());
  const sessionMiddleware = session({
    secret: 'electronic@2025#kailash07##1234!',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: env.NODE_ENV === 'production', // Only use secure cookies in production (HTTPS)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  });
  app.use(sessionMiddleware);
  
  const flashMiddleware = flash();
  app.use(flashMiddleware);
  // Request logging
  if (env.NODE_ENV === 'local') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Health check endpoint
  app.get('/health', (req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    });
  });


  return app;
}

/**
 * Error handling middleware
 */
export function setupErrorHandling(app: express.Application): void {
  // 404 handler
  app.use('*', (req: express.Request, res: express.Response) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Unhandled error:', err);

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Don't leak error details in production
    const errorResponse: any = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };

    if (env.NODE_ENV === 'local') {
      errorResponse.stack = err.stack;
      errorResponse.details = err;
    }

    res.status(statusCode).json(errorResponse);
  });
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any): void {
  const shutdown = (signal: string) => {
    console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('🔌 HTTP server closed');
      
      // Close database connections
      import('./database.js').then(({ Database }) => {
        Database.shutdown()
          .then(() => {
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
          })
          .catch((error) => {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
          });
      });
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Type definitions for the Electronic Admin application
 */

// Export interface definitions
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
  }
  
  export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  // Export type aliases
  export type Environment = 'development' | 'production' | 'test';
  
  export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

  
  export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
  }
  
  // Export utility type
  export type Partial<T> = {
    [P in keyof T]?: T[P];
  };
  
  // Export a configuration interface
  export interface AppConfig {
    port: number;
    env: Environment;
    database: {
      host: string;
      port: number;
      name: string;
    };
    jwt: {
      secret: string;
      expiresIn: string;
    };
  }
  
import { type Request, type Response, type NextFunction } from 'express';
import { Admin, type IAdmin } from '../models/Admin.js';
import type { ISetting } from '../models/Setting.js';

// Extend Express Request interface to include admin and flash
declare global {
  namespace Express {
    interface Request {
      admin?:IAdmin; // Current logged-in admin
      adminPermissions?: any; // Admin's permissions
      flash(type: string, message?: string): string[]; // Connect-flash method
      setting?:ISetting; // Current settings from session
    }
  }
}

// Extend express-session SessionData interface to include admin
declare module 'express-session' {
  interface SessionData {
    admin?: {
      _id?: string;
      id?: string;
      email?: string;
      username?: string;
      [key: string]: any;
    } | null;
    rememberMe?:{
      email:string;
      password?:string;
    } | null;
    setting?:{
      _id?:string;
      isMaintenance?:boolean;
      maintenanceMessage?:string;
      [key:string]:any;
    } | null;
  }
}


/**
 * Permission-based authorization middleware
 * Checks if admin has specific module and operation permission
 */
export function requirePermission(module: string, operation: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }
      
      // Check if admin has the required permission
      const hasPermission = await req.admin.hasPermission(module, operation);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Missing permission: ${module}:${operation}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed.'
      });
    }
  };
}

/**
 * Role-based authorization middleware
 * Checks if admin has specific role
 */
export function requireRole(requiredRole: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }
      
      // Check if admin has the required role
      await req.admin.populate('roles');
      const hasRole = req.admin.roles.some((role: any) => role.slug === requiredRole);
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required role: ${requiredRole}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Role authorization check failed.'
      });
    }
  };
}

/**
 * Multiple permissions check (OR logic)
 * Admin needs at least one of the specified permissions
 */
export function requireAnyPermission(permissionChecks: { module: string; operation: string }[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }
      
      // Check if admin has any of the required permissions
      for (const { module, operation } of permissionChecks) {
        const hasPermission = await req.admin.hasPermission(module, operation);
        if (hasPermission) {
          return next(); // Has at least one permission
        }
      }
      
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    } catch (error) {
      console.error('Multiple permissions check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed.'
      });
    }
  };
}

/**
 * Super Admin only middleware
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('super-admin')(req, res, next);
}


/**
 * Session-based authentication middleware for admin panel views
 * Authenticates admin using req.session.admin
 * If session exists, allows access to all routes
 * If session doesn't exist, only allows access to login, forgot-password, and reset-password pages
 */
export async function authenticateSessionAdmin(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    // Define public routes that don't require authentication
    const publicRoutes = [
      '/login',
      '/forgot-password',
      '/reset-password',
      '/logout'
    ];
    
    // Check if current route is a public route
    const isPublicRoute = publicRoutes.some(route => {
      // Exact match for /login, /forgot-password, /logout
      if (req.path === route) {
        return true;
      }
      // Pattern match for /reset-password/:token
      if (route === '/reset-password' && req.path.startsWith('/reset-password')) {
        return true;
      }
      return false;
    });
    
    // Check if admin session exists
    if (req.session && req.session.admin) {
      try {
        // Fetch admin from database to ensure it still exists and is valid
        const admin = await Admin.findById(req.session.admin._id || req.session.admin.id)
          .populate({
            path: 'roles',
            populate: {
              path: 'permissions'
            }
          });
        
        if (!admin) {
          // Admin not found, clear session and redirect to login
          delete req.session.admin;
          if (isPublicRoute) {
            return next();
          }
          return res.redirect('/login');
        }
        
        // Check if admin is active
        if (!admin.isActive) {
          delete req.session.admin;
          if (isPublicRoute) {
            return next();
          }
          return res.redirect('/login?error=account_inactive');
        }
        
        // Check if admin is blocked
        if (admin.isBlocked) {
          delete req.session.admin;
          if (isPublicRoute) {
            return next();
          }
          return res.redirect('/login?error=account_blocked');
        }
        
        // Check if account is locked
        if (admin.lockUntil && admin.lockUntil > new Date()) {
          delete req.session.admin;
          if (isPublicRoute) {
            return next();
          }
          return res.redirect('/login?error=account_locked');
        }
        
        // Set admin in request
        req.admin = admin;
        req.adminPermissions = await admin.getAllPermissions();
        
        // If authenticated and trying to access login page, redirect to dashboard
        if (req.path === '/login' && req.method === 'GET') {
          return res.redirect('/dashboard');
        }
        
        return next();
      } catch (error) {
        console.error('Error fetching admin from session:', error);
        delete req.session.admin;
        if (isPublicRoute) {
          return next();
        }
        return res.redirect('/login');
      }
    }
    
    // No session found
    // If it's a public route, allow access
    if (isPublicRoute) {
      return next();
    }
    
    // Not authenticated and trying to access protected route
    // Redirect to login page
    return res.redirect('/login');
  } catch (error) {
    console.error('Session authentication error:', error);
    // On error, allow public routes, redirect others to login
    const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/logout'];
    const isPublicRoute = publicRoutes.some(route => {
      if (req.path === route) return true;
      if (route === '/reset-password' && req.path.startsWith('/reset-password')) return true;
      return false;
    });
    
    if (isPublicRoute) {
      return next();
    }
    
    return res.redirect('/login');
  }
}

export async function checkAlreadyLoggedIn(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    if (req.session && req.session.admin) {
      return res.redirect('/');
    }
    next();
  }
  catch (error) {
    console.error('Error in checkAlreadyLoggedIn middleware:', error);
    next(error);
  }
}
import { type Request, type Response } from 'express';

/**
 * General Admin Controller
 * Handles other admin module views that don't have dedicated controllers yet
 */

/**
 * Show categories page
 */
export function showCategories(req: Request, res: Response): void {
    try {
      res.render('modules/categories/index.njk', {
        pageTitle: 'Categories',
        pageDescription: 'Manage product categories',
        currentPage: 'categories',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Categories', url: '/categories' }
        ]
      });
    } catch (error) {
      console.error('Error rendering categories page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show brands page
 */
export function showBrands(req: Request, res: Response): void {
    try {
      res.render('modules/brands/index.njk', {
        pageTitle: 'Brands',
        pageDescription: 'Manage product brands',
        currentPage: 'brands',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Brands', url: '/brands' }
        ]
      });
    } catch (error) {
      console.error('Error rendering brands page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show customers page
 */
export function showCustomers(req: Request, res: Response): void {
    try {
      res.render('modules/customers/index.njk', {
        pageTitle: 'Customers',
        pageDescription: 'Manage customer accounts',
        currentPage: 'customers',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Customers', url: '/customers' }
        ]
      });
    } catch (error) {
      console.error('Error rendering customers page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show orders page
 */
export function showOrders(req: Request, res: Response): void {
    try {
      res.render('modules/orders/index.njk', {
        pageTitle: 'Orders',
        pageDescription: 'Manage customer orders',
        currentPage: 'orders',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Orders', url: '/orders' }
        ]
      });
    } catch (error) {
      console.error('Error rendering orders page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show reviews page
 */
export function showReviews(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Reviews',
        pageDescription: 'Manage product reviews',
        currentPage: 'reviews',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Reviews', url: '/reviews' }
        ]
      });
    } catch (error) {
      console.error('Error rendering reviews page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show coupons page
 */
export function showCoupons(req: Request, res: Response): void {
    try {
      res.render('modules/coupons/index.njk', {
        pageTitle: 'Coupons',
        pageDescription: 'Manage discount coupons',
        currentPage: 'coupons',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Coupons', url: '/coupons' }
        ]
      });
    } catch (error) {
      console.error('Error rendering coupons page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show banners page
 */
export function showBanners(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Banners',
        pageDescription: 'Manage promotional banners',
        currentPage: 'banners',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Banners', url: '/banners' }
        ]
      });
    } catch (error) {
      console.error('Error rendering banners page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show settings page
 */
export function showSettings(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Settings',
        pageDescription: 'System configuration',
        currentPage: 'settings',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Settings', url: '/settings' }
        ]
      });
    } catch (error) {
      console.error('Error rendering settings page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show admin users page
 */
export function showAdminUsers(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Admin Users',
        pageDescription: 'Manage admin accounts',
        currentPage: 'admins',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Admin Users', url: '/admins' }
        ]
      });
    } catch (error) {
      console.error('Error rendering admin users page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show roles page
 */
export function showRoles(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Roles',
        pageDescription: 'Manage user roles',
        currentPage: 'roles',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Roles', url: '/roles' }
        ]
      });
    } catch (error) {
      console.error('Error rendering roles page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show permissions page
 */
export function showPermissions(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Permissions',
        pageDescription: 'Manage user permissions',
        currentPage: 'permissions',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Permissions', url: '/permissions' }
        ]
      });
    } catch (error) {
      console.error('Error rendering permissions page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show analytics page
 */
export function showAnalytics(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Analytics',
        pageDescription: 'View detailed analytics',
        currentPage: 'analytics',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Analytics', url: '/analytics' }
        ]
      });
    } catch (error) {
      console.error('Error rendering analytics page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show reports page
 */
export function showReports(req: Request, res: Response): void {
    try {
      res.render('modules/dashboard/index.njk', {
        pageTitle: 'Reports',
        pageDescription: 'Generate and view reports',
        currentPage: 'reports',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Reports', url: '/reports' }
        ]
      });
    } catch (error) {
      console.error('Error rendering reports page:', error);
      res.status(500).render('errors/500.njk');
    }
  }
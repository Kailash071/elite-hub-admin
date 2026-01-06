import express from 'express';

import * as AuthController from '../controllers/AuthController.js';
import * as DashboardController from '../controllers/DashboardController.js';
import * as ProductController from '../controllers/ProductsController.js';
import * as AdminController from '../controllers/AdminController.js';
import * as BrandsController from '../controllers/BrandsController.js';
import * as CategoriesController from '../controllers/CategoriesController.js';
import * as CustomersController from '../controllers/CustomersController.js';
import * as OrdersController from '../controllers/OrdersController.js';
import * as CouponsController from '../controllers/CouponsController.js';
import * as CmsController from '../controllers/CmsController.js';
import * as FaqController from '../controllers/FaqController.js';
import { authenticateSessionAdmin, checkAlreadyLoggedIn } from '../middleware/auth.js';

const router = express.Router();



// ===== AUTHENTICATION PAGES =====
router.get('/login', checkAlreadyLoggedIn, AuthController.showLogin);
router.post('/login', AuthController.handleLogin);
router.get('/forgot-password', checkAlreadyLoggedIn, AuthController.showForgotPassword);
router.post('/forgot-password', AuthController.handleForgotPassword);
router.get('/reset-password/:token', AuthController.showResetPassword);
router.post('/reset-password', AuthController.handleResetPassword);

router.use(authenticateSessionAdmin)

// ===== ADMIN DASHBOARD =====
router.get('/', DashboardController.index);
router.get('/dashboard/data', DashboardController.getData);
router.get('/profile', AuthController.showProfile);
router.post('/update-profile', AuthController.updateProfile);
router.get('/logout', AuthController.handleLogout);

// ===== ADMIN PRODUCTS =====
router.get('/products', ProductController.index);
router.get('/products/new', ProductController.create);
router.get('/products/:id', ProductController.show);
router.get('/products/:id/edit', ProductController.edit);




// ===== BRANDS ROUTES =====
router.get('/brands', BrandsController.index);
router.get('/brands/add', BrandsController.create);
router.post('/brands', BrandsController.store);
router.post('/brands/datatable', BrandsController.indexData);
router.post('/brands/bulk-action', BrandsController.bulkAction);
router.get('/brands/:id/edit', BrandsController.edit);
router.post('/brands/:id', BrandsController.update);
router.delete('/brands/:id', BrandsController.destroy);
router.get('/brands/:id/view', BrandsController.viewPage);
router.patch('/brands/:id/toggle-status', BrandsController.toggleStatus);

// ===== CATEGORIES ROUTES =====
router.get('/categories', CategoriesController.index);
router.get('/categories/add', CategoriesController.create);
router.post('/categories', CategoriesController.store);
router.get('/categories/:id/edit', CategoriesController.edit);
router.put('/categories/:id', CategoriesController.update);
router.delete('/categories/:id', CategoriesController.destroy);
router.get('/categories/tree', CategoriesController.tree);
router.post('/categories/datatable', CategoriesController.datatable);
router.patch('/categories/:id/toggle-status', CategoriesController.toggleStatus);
router.post('/categories/bulk-action', CategoriesController.bulkAction);

// ===== CUSTOMERS ROUTES =====
router.get('/customers', CustomersController.index);
router.get('/customers/add', CustomersController.create);
router.post('/customers', CustomersController.store);
router.get('/customers/:id', CustomersController.show);
router.get('/customers/:id/edit', CustomersController.edit);
router.put('/customers/:id', CustomersController.update);
router.delete('/customers/:id', CustomersController.destroy);
router.post('/customers/datatable', CustomersController.datatable);
router.patch('/customers/:id/toggle-status', CustomersController.toggleStatus);
router.patch('/customers/:id/toggle-block', CustomersController.toggleBlock);
router.post('/customers/:id/send-verification', CustomersController.sendVerification);
router.get('/customers/export', CustomersController.exportData);
router.post('/customers/bulk-action', CustomersController.bulkAction);

// ===== ORDERS ROUTES =====
router.get('/orders', OrdersController.index);
router.get('/orders/add', OrdersController.create);
router.post('/orders', OrdersController.store);
router.get('/orders/:id', OrdersController.show);
router.get('/orders/:id/edit', OrdersController.edit);
router.put('/orders/:id', OrdersController.update);
router.patch('/orders/:id/status', OrdersController.updateStatus);
router.post('/orders/datatable', OrdersController.datatable);
router.post('/orders/bulk-status', OrdersController.bulkStatus);
router.get('/orders/export', OrdersController.exportData);

// ===== COUPONS ROUTES =====
router.get('/coupons', CouponsController.index);
router.get('/coupons/add', CouponsController.create);
router.post('/coupons', CouponsController.store);
router.get('/coupons/:id/edit', CouponsController.edit);
router.put('/coupons/:id', CouponsController.update);
router.delete('/coupons/:id', CouponsController.destroy);
router.post('/coupons/:id/duplicate', CouponsController.duplicate);
router.post('/coupons/:id/test', CouponsController.test);
router.post('/coupons/datatable', CouponsController.datatable);
router.patch('/coupons/:id/toggle-status', CouponsController.toggleStatus);
router.post('/coupons/bulk-action', CouponsController.bulkAction);
router.get('/coupons/export', CouponsController.exportData);

// ===== OTHER ADMIN MODULES =====
router.get('/reviews', AdminController.showReviews);
router.get('/banners', AdminController.showBanners);
router.get('/settings', AdminController.showSettings);
router.get('/admins', AdminController.showAdminUsers);
router.get('/roles', AdminController.showRoles);
router.get('/permissions', AdminController.showPermissions);
router.get('/analytics', AdminController.showAnalytics);
router.get('/reports', AdminController.showReports);

// ===== CMS ROUTES =====
router.get('/cms', CmsController.index);
router.get('/cms/add', CmsController.create);
router.post('/cms', CmsController.store);
router.post('/cms/datatable', CmsController.indexData);
router.post('/cms/bulk-action', CmsController.bulkAction);
router.get('/cms/:id/edit', CmsController.edit);
router.post('/cms/:id', CmsController.update);
router.delete('/cms/:id', CmsController.destroy);
router.patch('/cms/:id/toggle-status', CmsController.toggleStatus);

// ===== FAQ ROUTES =====
router.get('/faqs', FaqController.index);
router.get('/faqs/add', FaqController.create);
router.post('/faqs', FaqController.store);
router.post('/faqs/datatable', FaqController.indexData);
router.post('/faqs/bulk-action', FaqController.bulkAction);
router.get('/faqs/:id/edit', FaqController.edit);
router.post('/faqs/:id', FaqController.update);
router.delete('/faqs/:id', FaqController.destroy);
router.patch('/faqs/:id/toggle-status', FaqController.toggleStatus);

// ===== ADDITIONAL BRAND ROUTES =====

// ===== ADDITIONAL CATEGORY ROUTES =====
router.get('/categories/:id/products', CategoriesController.showProducts);

// ===== ADDITIONAL CUSTOMER ROUTES =====
router.get('/customers/:id/orders', CustomersController.showOrders);
router.get('/customers/:id/addresses', CustomersController.showAddresses);

// ===== ADDITIONAL ORDER ROUTES =====
router.get('/orders/:id/invoice', OrdersController.showInvoice);
router.get('/orders/:id/invoice/print', OrdersController.printInvoice);
router.get('/orders/:id/tracking', OrdersController.showTracking);
router.post('/orders/:id/send-update', OrdersController.sendUpdate);

// ===== ADDITIONAL COUPON ROUTES =====
router.get('/coupons/:id/usage', CouponsController.showUsage);
router.get('/coupons/:id/usage/export', CouponsController.exportUsage);
router.post('/coupons/:id/usage-data', CouponsController.usageData);

export default router;

import { type Request, type Response } from 'express';
import { OrderService, CustomerService, ProductService } from '../services/index.js';

/**
 * Dashboard Controller
 * Handles admin dashboard view rendering and logic
 */

/**
 * Show admin dashboard
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
      // Get basic counts for dashboard
      const [
        totalOrders,
        totalCustomers,
        totalProducts,
        recentOrders
      ] = await Promise.all([
        OrderService.countOrders(),
        CustomerService.countCustomers(),
        ProductService.countProducts(),
        OrderService.findRecentOrders(5)
      ]);

      // Get revenue stats
      const orderStats = await OrderService.getOrderStats();
      const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 };

      const dashboardData = {
        stats: {
          totalOrders,
          totalRevenue: Math.round(stats.totalRevenue),
          totalCustomers,
          totalProducts,
          averageOrderValue: Math.round(stats.averageOrderValue),
          conversionRate: totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0
        },
        trends: {
          ordersGrowth: 15, // Mock data - would need historical comparison
          revenueGrowth: 8,
          customersGrowth: 22,
          productsGrowth: 5
        },
        recentOrders: recentOrders.map((order: any) => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customer ? 
              `${order.customer.firstName} ${order.customer.lastName}` : 
              'Guest User',
            email: order.customer?.email || 'N/A'
          },
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt
        })),
        topProducts: [
          { _id: '1', name: 'Premium Electronic Set', price: 599, salesCount: 45 },
          { _id: '2', name: 'Traditional Colors Pack', price: 299, salesCount: 32 },
          { _id: '3', name: 'Festival Special Kit', price: 799, salesCount: 28 }
        ], // Mock data - would need product sales aggregation
        recentActivity: [
          {
            type: 'success',
            title: 'New Order Received',
            description: 'Order #ORD-2024-004 from Bob Wilson',
            timestamp: new Date()
          }
        ], // Mock data - would need activity tracking
        pageTitle: 'Dashboard',
        pageDescription: "Welcome back! Here's what's happening with your store.",
        currentPage: 'dashboard',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' }
        ],
        error: req.flash('error'),
        success: req.flash('success')
      };

      res.render('modules/dashboard/index.njk', dashboardData);
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Get dashboard data (AJAX endpoint)
 */
export async function getData(req: Request, res: Response): Promise<void> {
    try {
      // Get fresh dashboard data using simple services
      const [
        totalOrders,
        totalCustomers,
        totalProducts
      ] = await Promise.all([
        OrderService.countOrders(),
        CustomerService.countCustomers(),
        ProductService.countProducts()
      ]);

      // Get revenue stats
      const orderStats = await OrderService.getOrderStats();
      const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 };

      res.json({
        success: true,
        stats: {
          totalOrders,
          totalRevenue: Math.round(stats.totalRevenue),
          totalCustomers,
          totalProducts,
          averageOrderValue: Math.round(stats.averageOrderValue)
        },
        trends: {
          ordersGrowth: 15,
          revenueGrowth: 8,
          customersGrowth: 22,
          productsGrowth: 5
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }

/**
 * Redirect to dashboard (for root admin route)
 */
export function redirectToDashboard(req: Request, res: Response): void {
    res.redirect('/dashboard');
  }

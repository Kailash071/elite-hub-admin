import { type Request, type Response } from 'express';
import {
    OrderService,
    CustomerService,
    ProductService
} from '../services/index.js';

/**
 * Orders Controller
 * Handles CRUD operations for order management
 */

/**
 * Show orders listing page
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
        // Fetch basic stats
        // In a real app, these should be cached or aggregated more efficiently
        const statsData = await OrderService.getOrderStats();
        // Since getOrderStats returns an array with one object for totals
        const totalStats = statsData[0] || { totalOrders: 0, totalRevenue: 0 };

        const pendingCount = await OrderService.countOrders({ status: 'pending' });
        const completedCount = await OrderService.countOrders({ status: 'delivered' }); // Assuming delivered is completed

        const stats = {
            totalOrders: totalStats.totalOrders,
            pendingOrders: pendingCount,
            completedOrders: completedCount,
            totalRevenue: totalStats.totalRevenue,
            ordersGrowth: '+0%' // Placeholder for real growth calculation
        };

        res.render('modules/orders/index.njk', {
            pageTitle: 'Orders',
            pageDescription: 'Manage customer orders',
            currentPage: 'orders',
            stats,
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
 * Show create order form
 */
export async function create(req: Request, res: Response): Promise<void> {
    try {
        // Fetch customers and products for dropdowns
        const [{ customers }, { products }] = await Promise.all([
            CustomerService.findCustomers({}, { limit: 1000, sort: { firstName: 1 } }), // Limit might need handling for large datasets
            ProductService.findProducts({ isActive: true }, { limit: 1000, sort: { name: 1 } })
        ]);

        res.render('modules/orders/form.njk', {
            pageTitle: 'Add Order',
            pageDescription: 'Create a new order',
            currentPage: 'orders',
            formData: req.body || {},
            customers,
            products,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Orders', url: '/orders' },
                { text: 'Add Order', url: '/orders/add' }
            ]
        });
    } catch (error) {
        console.error('Error rendering order create form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Store new order
 */
export async function store(req: Request, res: Response): Promise<void> {
    try {
        const orderData = req.body;

        // Generate Order Number if not provided
        if (!orderData.orderNumber) {
            orderData.orderNumber = `ORD-${Date.now()}`;
        }

        // Basic validation/sanitization could go here

        await OrderService.createOrder(orderData);

        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                success: true,
                message: 'Order created successfully',
                redirectUrl: '/orders'
            });
        } else {
            req.flash('success', 'Order created successfully');
            res.redirect('/orders');
        }
    } catch (error) {
        console.error('Error creating order:', error);

        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.status(400).json({
                success: false,
                message: 'Failed to create order',
                errors: { general: (error as Error).message }
            });
        } else {
            req.flash('error', 'Failed to create order');
            res.redirect('/orders/add');
        }
    }
}

/**
 * Show order details
 */
export async function show(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const order = await OrderService.findOrderById(id);

        if (!order) {
            res.status(404).render('errors/404.njk');
            return;
        }

        res.render('modules/orders/details.njk', {
            pageTitle: `Order ${order.orderNumber}`,
            pageDescription: 'Order details and tracking',
            currentPage: 'orders',
            order,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Orders', url: '/orders' },
                { text: 'Order Details', url: `/orders/${id}` }
            ]
        });
    } catch (error) {
        console.error('Error rendering order details:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Show edit order form
 */
export async function edit(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const order = await OrderService.findOrderById(id);

        if (!order) {
            res.status(404).render('errors/404.njk');
            return;
        }

        const [{ customers }, { products }] = await Promise.all([
            CustomerService.findCustomers({}, { limit: 1000, sort: { firstName: 1 } }),
            ProductService.findProducts({ isActive: true }, { limit: 1000, sort: { name: 1 } })
        ]);

        res.render('modules/orders/form.njk', {
            pageTitle: 'Edit Order',
            pageDescription: 'Edit order information',
            currentPage: 'orders',
            order,
            customers,
            products,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Orders', url: '/orders' },
                { text: 'Edit Order', url: `/orders/${id}/edit` }
            ]
        });
    } catch (error) {
        console.error('Error rendering order edit form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Update order
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).redirect('/orders');
            return;
        }
        const orderData = req.body;

        await OrderService.updateOrderById(id, orderData);

        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                success: true,
                message: 'Order updated successfully',
                redirectUrl: '/orders'
            });
        } else {
            req.flash('success', 'Order updated successfully');
            res.redirect('/orders');
        }
    } catch (error) {
        console.error('Error updating order:', error);

        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.status(400).json({
                success: false,
                message: 'Failed to update order',
                errors: { general: (error as Error).message }
            });
        } else {
            req.flash('error', 'Failed to update order');
            res.redirect(`/orders/${req.params.id}/edit`);
        }
    }
}

/**
 * Update order status
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ success: false, message: 'ID is required' });
            return;
        }
        const { status, notes, trackingNumber, carrier } = req.body;

        const updateData: any = { status };

        // Handle specific status updates
        if (status === 'shipped') {
            if (trackingNumber) updateData['shipping.trackingNumber'] = trackingNumber;
            if (carrier) updateData['shipping.carrier'] = carrier;
            updateData.shippedAt = new Date();
        } else if (status === 'delivered') {
            updateData.deliveredAt = new Date();
        } else if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
        } else if (status === 'confirmed') {
            updateData.confirmedAt = new Date();
        } else if (status === 'returned') {
            updateData.returnedAt = new Date();
        }

        if (notes) {
            updateData.adminNotes = notes; // Append or replace notes?
        }

        await OrderService.updateOrderById(id, updateData);

        res.json({
            success: true,
            message: `Order status updated to ${status} successfully`
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
}

/**
 * DataTable AJAX endpoint
 */
export async function datatable(req: Request, res: Response): Promise<void> {
    try {
        const { draw, start, length, search, order: sortOrder, status, payment, paymentStatus, dateRange } = req.body;

        const page = (parseInt(start) / parseInt(length)) + 1;
        const limit = parseInt(length);

        const query: any = {};

        // Search
        if (search && search.value) {
            const searchTerm = search.value;
            query.$or = [
                { orderNumber: { $regex: searchTerm, $options: 'i' } },
                { customerEmail: { $regex: searchTerm, $options: 'i' } },
                // Add more fields if needed, or use text index if available
            ];
        }

        // Filters
        if (status) query.status = status;
        if (payment) query['payment.method'] = payment;
        if (paymentStatus) query['payment.status'] = paymentStatus;

        if (dateRange) {
            const now = new Date();
            let startDate;
            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
            }
            if (startDate) {
                query.orderDate = { $gte: startDate };
            }
        }

        // Sorting
        const sort: any = {};
        if (sortOrder && sortOrder.length > 0) {
            const columnIndex = sortOrder[0].column;
            const columnDir = sortOrder[0].dir;
            const columnMap: { [key: number]: string } = {
                1: 'orderNumber',
                4: 'totalAmount',
                6: 'status',
                7: 'orderDate'
            };
            if (columnMap[columnIndex]) {
                sort[columnMap[columnIndex]] = columnDir === 'asc' ? 1 : -1;
            } else {
                sort.createdAt = -1;
            }
        } else {
            sort.createdAt = -1;
        }

        const { orders, total } = await OrderService.findOrders(query, { page, limit, sort });

        const data = orders.map(order => ({
            checkbox: `<input type="checkbox" class="row-checkbox" value="${order._id}">`,
            orderNumber: `<strong>${order.orderNumber}</strong>`,
            customer: `${order.customer?.firstName || 'Unknown'} ${order.customer?.lastName || ''}<br><small>${order.customerEmail}</small>`,
            products: `<span class="badge bg-label-info">${order.items?.length || 0} Items</span>`,
            amount: `<strong>$${order.totalAmount.toFixed(2)}</strong><br><small>${order.payment?.method || ''}</small>`,
            payment: `<span class="badge bg-label-${getPaymentStatusColor(order.payment?.status)}">${order.payment?.status || 'Unknown'}</span>`,
            status: `<span class="badge bg-label-${getStatusColor(order.status)}">${order.status}</span>`,
            date: `${new Date(order.orderDate).toLocaleDateString()}<br><small>${new Date(order.orderDate).toLocaleTimeString()}</small>`,
            actions: generateActionsHtml(order._id, order.status, order.shipping?.trackingNumber)
        }));

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: total,
            recordsFiltered: total, // We might need separate count for filtered if we were doing more complex stuff
            data
        });
    } catch (error) {
        console.error('Error in orders datatable:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Helpers for DataTable presentation
function getStatusColor(status: string): string {
    switch (status) {
        case 'delivered': return 'success';
        case 'shipped': return 'info';
        case 'processing': return 'primary';
        case 'confirmed': return 'primary';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        case 'returned': return 'secondary';
        default: return 'secondary';
    }
}

function getPaymentStatusColor(status: string): string {
    switch (status) {
        case 'completed': return 'success';
        case 'pending': return 'warning';
        case 'failed': return 'danger';
        case 'refunded': return 'info';
        default: return 'secondary';
    }
}

function generateActionsHtml(id: string, status: string, trackingNumber?: string): string {
    // Simplified action generation - ideally this would be done in Nunjucks via macro or similar if not using AJAX source
    // But since we are returning JSON, we generate HTML here.
    return `
      <div class="dropdown">
        <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
          <i class="bx bx-dots-vertical-rounded"></i>
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="/orders/${id}">
            <i class="bx bx-show me-1"></i> View Details
          </a>
          <a class="dropdown-item" href="/orders/${id}/edit">
            <i class="bx bx-edit-alt me-1"></i> Edit Order
          </a>
           <a class="dropdown-item" href="/orders/${id}/invoice">
            <i class="bx bx-receipt me-1"></i> View Invoice
          </a>
        </div>
      </div>
    `;
}


/**
 * Bulk status update
 */
export async function bulkStatus(req: Request, res: Response): Promise<void> {
    try {
        const { status, orderIds } = req.body;

        // Loop update for now, ideally perform bulk write if logic allows
        // But since we have status specific logic (dates), service loop might be better or bulkWrite
        // For simplicity:
        // TODO: Implement bulk update in Service

        for (const id of orderIds) {
            const updateData: any = { status };
            if (status === 'delivered') updateData.deliveredAt = new Date();
            else if (status === 'shipped') updateData.shippedAt = new Date();
            else if (status === 'confirmed') updateData.confirmedAt = new Date();
            else if (status === 'cancelled') updateData.cancelledAt = new Date();

            await OrderService.updateOrderById(id, updateData);
        }

        res.json({
            success: true,
            message: `${orderIds.length} orders updated to ${status} successfully`
        });
    } catch (error) {
        console.error('Error in bulk status update:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to perform bulk status update'
        });
    }
}

/**
 * Export orders data
 */
export async function exportData(req: Request, res: Response): Promise<void> {
    try {
        // Placeholder for export logic
        res.redirect('/orders?exported=true');
    } catch (error) {
        console.error('Error exporting orders:', error);
        res.redirect('/orders?error=export_failed');
    }
}

export function showInvoice(req: Request, res: Response): void {
    // .. Implementation similar to before but with real fetch
    // For brevity assuming similar pattern: Fetch -> Render
    // Implementation needed
    res.status(501).send('Not implemented yet');
}

export function printInvoice(req: Request, res: Response): void {
    res.status(501).send('Not implemented yet');
}

export function showTracking(req: Request, res: Response): void {
    res.status(501).send('Not implemented yet');
}

export async function sendUpdate(req: Request, res: Response): Promise<void> {
    res.status(501).json({ message: 'Not implemented yet' });
}

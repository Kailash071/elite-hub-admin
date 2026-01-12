import { type Request, type Response } from 'express';
import { CustomerService } from '../services/index.js';
import { redirectWithFlash } from './index.js';
import * as CryptoUtility from "../utils/crypto"
/**
 * Customers Controller
 * Handles CRUD operations for customer management
 */

/**
 * Show customers listing page
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
        res.render('modules/customers/index.njk', {
            pageTitle: 'Customers',
            pageDescription: 'Manage customer accounts',
            currentPage: 'customers',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Customers', url: '/customers' }
            ],
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error rendering customers page:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Show create customer form
 */
export async function create(req: Request, res: Response): Promise<void> {
    try {
        res.render('modules/customers/form.njk', {
            pageTitle: 'Add Customer',
            pageDescription: 'Create a new customer account',
            currentPage: 'customers',
            formData: {},
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Customers', url: '/customers' },
                { text: 'Add Customer', url: '/customers/add' }
            ],
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error rendering customer create form:', error);
        req.flash('error', 'Failed to render customer create form: ' + (error as Error).message);
        return redirectWithFlash(req, res, "/customers");
    }
}

/**
 * Store new customer
 */
export async function store(req: Request, res: Response): Promise<void> {
    try {
        const rawData = req.body;

        // Handle flattened address data (e.g. addresses[0][type])
        if (!rawData.addresses && Object.keys(rawData).some(k => k.startsWith('addresses['))) {
            const addresses: any[] = [];
            const indices = new Set<number>();
            Object.keys(rawData).forEach(key => {
                const match = key.match(/^addresses\[(\d+)\]/);
                if (match) {
                    indices.add(parseInt(match[1]!));
                }
            });

            Array.from(indices).sort((a, b) => a - b).forEach(index => {
                const addr: any = {};
                // Extract all fields for this index
                Object.keys(rawData).forEach(key => {
                    if (key.startsWith(`addresses[${index}][`)) {
                        const field = key.replace(`addresses[${index}][`, '').replace(']', '');
                        addr[field] = rawData[key];
                    }
                });
                addresses.push(addr);
            });
            rawData.addresses = addresses;
        }

        // Basic data processing
        const customerData: any = {
            firstName: rawData.firstName,
            lastName: rawData.lastName,
            email: rawData.email,
            phone: rawData.phone,
            password: CryptoUtility.hashPassword(rawData.password || ''),
            gender: rawData.gender,
            isActive: rawData.isActive === 'on' || rawData.isActive === true,
            emailVerified: rawData.emailVerified === 'on',
            phoneVerified: rawData.phoneVerified === 'on',
            preferences: {
                newsletter: rawData.preferences?.newsletter === 'on' || rawData['preferences[newsletter]'] === 'on',
                smsNotifications: rawData.preferences?.smsNotifications === 'on' || rawData['preferences[smsNotifications]'] === 'on',
                emailNotifications: rawData.preferences?.emailNotifications === 'on' || rawData['preferences[emailNotifications]'] === 'on',
                language: rawData.preferences?.language || rawData['preferences[language]'] || 'en',
                currency: rawData.preferences?.currency || rawData['preferences[currency]'] || 'INR'
            },
            addresses: (rawData.addresses || []).map((addr: any) => ({
                ...addr,
                isDefault: addr.isDefault === 'on' || addr.isDefault === true
            }))
        };

        if (rawData.dateOfBirth) {
            customerData.dateOfBirth = new Date(rawData.dateOfBirth);
        }

        await CustomerService.createCustomer(customerData);

        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                success: true,
                message: 'Customer created successfully',
                redirectUrl: '/customers'
            });
        } else {
            req.flash('success', 'Customer created successfully');
            redirectWithFlash(req, res, '/customers');
        }

    } catch (error) {
        console.error('Error creating customer:', error);
        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.status(400).json({
                success: false,
                message: 'Failed to create customer: ' + (error as Error).message
            });
        } else {
            req.flash('error', 'Failed to create customer: ' + (error as Error).message);
            redirectWithFlash(req, res, '/customers/add');
        }
    }
}

/**
 * Show customer details
 */
export async function show(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Customer not found');
            return redirectWithFlash(req, res, '/customers');
        }
        let customer = await CustomerService.findCustomerById(id);

        if (!customer) {
            req.flash('error', 'Customer not found');
            return redirectWithFlash(req, res, '/customers');
        }

        res.render('modules/customers/details.njk', {
            pageTitle: `${customer.firstName} ${customer.lastName}`,
            pageDescription: 'Customer details and activity',
            currentPage: 'customers',
            customer,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Customers', url: '/customers' },
                { text: 'Customer Details', url: `/customers/${id}` }
            ],
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error rendering customer details:', error);
        req.flash('error', 'Failed to render customer details: ' + (error as Error).message);
        return redirectWithFlash(req, res, '/customers');
    }
}

/**
 * Show edit customer form
 */
export async function edit(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Customer not found');
            return redirectWithFlash(req, res, '/customers');
        }
        let customer = await CustomerService.findCustomerById(id);

        if (!customer) {
            req.flash('error', 'Customer not found');
            return redirectWithFlash(req, res, '/customers');
        }

        res.render('modules/customers/form.njk', {
            pageTitle: 'Edit Customer',
            pageDescription: 'Edit customer information',
            currentPage: 'customers',
            customer,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Customers', url: '/customers' },
                { text: 'Edit Customer', url: `/customers/${id}/edit` }
            ],
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error rendering customer edit form:', error);
        req.flash('error', 'Failed to render customer edit form: ' + (error as Error).message);
        return redirectWithFlash(req, res, '/customers');
    }
}

/**
 * Update customer
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        if (!id) {
            req.flash('error', 'Customer not found');
            return redirectWithFlash(req, res, '/customers');
        }
        const rawData = req.body;

        const updateData: any = {
            firstName: rawData.firstName,
            lastName: rawData.lastName,
            email: rawData.email,
            phone: rawData.phone,
            gender: rawData.gender,
            isActive: rawData.isActive === 'on' || rawData.isActive === true,
            isBlocked: rawData.isBlocked === 'on' || rawData.isBlocked === true,
            blockReason: rawData.blockReason,
            emailVerified: rawData.emailVerified === 'on',
            phoneVerified: rawData.phoneVerified === 'on',
            preferences: {
                newsletter: rawData.preferences?.newsletter === 'on' || rawData['preferences[newsletter]'] === 'on',
                smsNotifications: rawData.preferences?.smsNotifications === 'on' || rawData['preferences[smsNotifications]'] === 'on',
                emailNotifications: rawData.preferences?.emailNotifications === 'on' || rawData['preferences[emailNotifications]'] === 'on',
                language: rawData.preferences?.language || rawData['preferences[language]'] || 'en',
                currency: rawData.preferences?.currency || rawData['preferences[currency]'] || 'INR'
            }
        };

        // Handle flattened address data for update
        if (!rawData.addresses && Object.keys(rawData).some(k => k.startsWith('addresses['))) {
            const addresses: any[] = [];
            const indices = new Set<number>();
            Object.keys(rawData).forEach(key => {
                const match = key.match(/^addresses\[(\d+)\]/);
                if (match) {
                    indices.add(parseInt(match[1]!));
                }
            });

            Array.from(indices).sort((a, b) => a - b).forEach(index => {
                const addr: any = {};
                Object.keys(rawData).forEach(key => {
                    if (key.startsWith(`addresses[${index}][`)) {
                        const field = key.replace(`addresses[${index}][`, '').replace(']', '');
                        addr[field] = rawData[key];
                    }
                });
                addresses.push(addr);
            });
            rawData.addresses = addresses;
        }

        if (rawData.addresses && Array.isArray(rawData.addresses)) {
            updateData.addresses = rawData.addresses.map((addr: any) => ({
                ...addr,
                isDefault: addr.isDefault === 'on' || addr.isDefault === true
            }));
        }

        if (rawData.password) {
            updateData.password = CryptoUtility.hashPassword(rawData.password);
        }

        if (rawData.dateOfBirth) {
            updateData.dateOfBirth = new Date(rawData.dateOfBirth);
        }

        await CustomerService.updateCustomerById(id, updateData);

        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                success: true,
                message: 'Customer updated successfully',
                redirectUrl: '/customers'
            });
        } else {
            req.flash('success', 'Customer updated successfully');
            redirectWithFlash(req, res, '/customers');
        }
    } catch (error) {
        console.error('Error updating customer:', error);
        if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.status(400).json({
                success: false,
                message: 'Failed to update customer: ' + (error as Error).message
            });
        } else {
            req.flash('error', 'Failed to update customer');
            redirectWithFlash(req, res, `/customers/${req.params.id}/edit`);
        }
    }
}

/**
 * Delete customer
 */
export async function destroy(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }
        await CustomerService.updateCustomerById(id, { isActive: false, isDeleted: true });

        return res.status(200).json({
            success: true,
            message: 'Customer deleted successfully',
            redirectUrl: '/customers'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return res.status(400).json({
            success: false,
            message: 'Failed to delete customer: ' + (error as Error).message
        });
    }
}

/**
 * DataTable AJAX endpoint
 */
export async function datatable(req: Request, res: Response): Promise<void> {
    try {
        const { draw, start, length, search, order: sortOrder, columns } = req.body;
        const { status, verification, membership, registration, searchTerm } = req.body; // Custom filters

        const page = (parseInt(start) / parseInt(length)) + 1;
        const limit = parseInt(length);

        const query: any = { isDeleted: false };

        // Search
        const searchValue = searchTerm || (search && search.value);
        if (searchValue) {
            // Use regex for more predictive partial matching if text index isn't preferred or as fallback
            const searchRegex = { $regex: searchValue, $options: 'i' };
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];
        }

        // Status Filter
        if (status) {
            if (status === 'active') {
                query.isActive = true;
                query.isBlocked = false;
            }
            else if (status === 'inactive') {
                query.isActive = false;
                query.isBlocked = false;
            }
            else if (status === 'blocked') {
                query.isBlocked = true;
            }
        }

        // Verification Filter
        if (verification) {
            if (verification === 'verified') query.emailVerified = true;
            else if (verification === 'unverified') query.emailVerified = false;
        }

        // Membership Filter
        if (membership) {
            query.membershipTier = membership;
        }

        // Registration Date Filter
        if (registration) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (registration === 'today') {
                query.createdAt = { $gte: today };
            } else if (registration === 'week') {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                query.createdAt = { $gte: weekStart };
            } else if (registration === 'month') {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                query.createdAt = { $gte: monthStart };
            } else if (registration === 'year') {
                const yearStart = new Date(today.getFullYear(), 0, 1);
                query.createdAt = { $gte: yearStart };
            }
        }

        // Sorting
        const sort: any = {};
        if (sortOrder && sortOrder.length > 0) {
            const columnIndex = sortOrder[0].column;
            const columnDir = sortOrder[0].dir;
            const columnName = columns[columnIndex].data;

            // Map table columns to DB fields
            const fieldMap: { [key: string]: string } = {
                'customer': 'firstName',
                'contact': 'phone',
                'orders': 'totalOrders',
                'totalSpent': 'totalSpent',
                'membership': 'membershipTier',
                'status': 'isActive',
                'joinDate': 'createdAt'
            };

            if (fieldMap[columnName]) {
                sort[fieldMap[columnName]] = columnDir === 'asc' ? 1 : -1;
            } else {
                sort.createdAt = -1;
            }
        } else {
            sort.createdAt = -1;
        }

        const { customers, total } = await CustomerService.findCustomers(query, {
            page,
            limit,
            sort,
            select: 'firstName lastName email emailVerified phone phoneVerified totalOrders totalSpent averageOrderValue membershipTier loyaltyPoints isActive isBlocked createdAt lastLoginAt'
        });

        // Pass raw data directly - frontend will handle presentation
        const data = customers;

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: total,
            recordsFiltered: total,
            data
        });
    } catch (error) {
        console.error('Error in customers datatable:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Toggle customer status
 */
export async function toggleStatus(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Customer ID is required');
            return redirectWithFlash(req, res, "/customers");
        }
        const { isActive } = req.body;

        await CustomerService.updateCustomerById(id, { isActive: isActive === 'on' || isActive === true });

        res.json({
            success: true,
            message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error toggling customer status:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update customer status'
        });
    }
}

/**
 * Toggle customer block status
 */
export async function toggleBlock(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Customer ID is required');
            return redirectWithFlash(req, res, "/customers");
        }
        const { isBlocked, blockReason } = req.body;

        await CustomerService.updateCustomerById(id, { isBlocked, blockReason });

        res.json({
            success: true,
            message: `Customer ${isBlocked ? 'blocked' : 'unblocked'} successfully`
        });
    } catch (error) {
        console.error('Error toggling customer block status:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update customer block status'
        });
    }
}




/**
 * Bulk actions
 */
export async function bulkAction(req: Request, res: Response): Promise<void> {
    try {
        const { action, customerIds } = req.body;
        if (!customerIds || customerIds.length === 0) {
            res.status(400).json({ success: false, message: 'No items selected' });
            return;
        }

        let message = '';
        switch (action) {
            case 'activate':
                await CustomerService.bulkUpdateStatus(customerIds, true);
                message = `${customerIds.length} customers activated successfully`;
                break;
            case 'deactivate':
                await CustomerService.bulkUpdateStatus(customerIds, false);
                message = `${customerIds.length} customers deactivated successfully`;
                break;
            case 'block':
                await CustomerService.bulkUpdateBlockStatus(customerIds, true);
                message = `${customerIds.length} customers blocked successfully`;
                break;
            case 'unblock':
                await CustomerService.bulkUpdateBlockStatus(customerIds, false);
                message = `${customerIds.length} customers unblocked successfully`;
                break;
            case 'delete':
                await CustomerService.updateMany({ _id: { $in: customerIds } }, { isActive: false, isDeleted: true });
                message = `${customerIds.length} customers deleted successfully`;
                break;
            default:
                throw new Error('Invalid action');
        }

        res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Error in bulk action:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to perform bulk action'
        });
    }
}
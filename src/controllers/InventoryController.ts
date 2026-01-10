import { type Request, type Response } from 'express';
import { ProductService, CategoryService, BrandService } from '../services/index.js';

/**
 * Inventory Controller
 * Handles stock management and inventory viewing
 */
/**
 * Inventory Controller
 * Handles stock management and inventory viewing
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
        const [categories, brands] = await Promise.all([
            CategoryService.findAllCategories(),
            BrandService.findActiveBrands()
        ]);

        res.render('modules/inventory/index.njk', {
            pageTitle: 'Inventory Management',
            currentPage: 'inventory',
            categories,
            brands,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Inventory', url: '/inventory' }
            ],
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Inventory Error:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * DataTable AJAX endpoint for inventory
 */
export async function indexData(req: Request, res: Response): Promise<void> {
    try {
        const { draw, start, length, search, order: sortOrder, columns } = req.body;
        const { category, brand, stockStatus } = req.body;

        const page = (parseInt(start) / parseInt(length)) + 1;
        const limit = parseInt(length);

        const query: any = {};

        // Always filter by tracking enabled
        query.stockTracking = true;

        // Search
        if (search && search.value) {
            const searchTerm = search.value;
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { sku: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Filters
        if (category) {
            query.$or = [
                { mainCategory: category },
                { subCategories: category }
            ];
        }
        if (brand) query.brand = brand;
        if (stockStatus) query.stockStatus = stockStatus;

        // Sorting
        const sort: any = {};
        if (sortOrder && sortOrder.length > 0) {
            const columnIndex = sortOrder[0].column;
            const columnDir = sortOrder[0].dir;
            const columnName = columns[columnIndex].data;

            const fieldMap: { [key: string]: string } = {
                'name': 'name',
                'sku': 'sku',
                'stock': 'stockQuantity',
                'status': 'stockStatus'
            };

            if (fieldMap[columnName]) {
                sort[fieldMap[columnName]] = columnDir === 'asc' ? 1 : -1;
            } else {
                sort.stockQuantity = 1; // Default
            }
        } else {
            sort.stockQuantity = 1;
        }

        const { products, total } = await ProductService.findProducts(query, {
            page,
            limit,
            sort,
            select: 'name sku images stockQuantity lowStockThreshold stockStatus brand'
        });

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: total,
            recordsFiltered: total,
            data: products
        });
    } catch (error) {
        console.error('Error in inventory datatable:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Quick stock update via AJAX
 */
export async function updateStock(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { action, quantity } = req.body; // action: 'add', 'subtract', 'set'

        if (!id) {
            res.status(400).json({ success: false, message: 'ID is required' });
            return;
        }

        const product = await ProductService.findProductById(id);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }

        let newQuantity = product.stockQuantity;
        const qty = Number(quantity);

        if (action === 'add') newQuantity += qty;
        else if (action === 'subtract') newQuantity -= qty;
        else if (action === 'set') newQuantity = qty;

        // Ensure non-negative
        newQuantity = Math.max(0, newQuantity);

        // Update stock
        await ProductService.updateProductStock(id, newQuantity);

        // Re-fetch to get calculated status if any
        const updatedProduct = await ProductService.findProductById(id);

        res.json({
            success: true,
            message: 'Stock updated successfully',
            newQuantity: updatedProduct?.stockQuantity,
            newStatus: updatedProduct?.stockStatus
        });

    } catch (error) {
        console.error('Update Stock Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update stock' });
    }
}

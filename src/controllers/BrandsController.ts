import { type Request, type Response } from 'express';
import * as BrandService from '../services/brand.js';
import { redirectWithFlash } from './index.js';

/**
 * Show brands listing page
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
        res.render('modules/brands/index.njk', {
            pageTitle: 'Brands',
            pageDescription: 'Manage product brands',
            currentPage: 'brands',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Brands', url: '/brands' }
            ],
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error rendering brands page:', error);
        res.status(500).render('errors/500.njk');
    }
}

export async function indexData(req: Request, res: Response): Promise<void> {
    try {
        const { draw, start, length, search, order, columns, status, featured } = req.body;
        const page = Math.floor(parseInt(start) / parseInt(length)) + 1;
        const limit = parseInt(length);

        const query: any = { isDeleted: false };
        if (search && search.value) {
            query.$or = [
                { name: { $regex: search.value, $options: 'i' } },
                { slug: { $regex: search.value, $options: 'i' } }
            ];
        }

        // Custom filters
        if (status) query.isActive = status === 'active';
        if (featured) query.isFeatured = featured === 'true';

        // Sorting
        const sort: any = {};
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const dir = order[0].dir === 'asc' ? 1 : -1;
            const columnName = columns[columnIndex].name;

            if (['name', 'sortOrder', 'isActive', 'isFeatured', 'createdAt'].includes(columnName)) {
                sort[columnName] = dir;
            } else {
                sort.sortOrder = 1; // Default
            }
        } else {
            sort.sortOrder = 1;
        }

        const result = await BrandService.findBrands(query, { page, limit, sort });
        const totalRecords = await BrandService.countBrands(query);

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: totalRecords,
            recordsFiltered: result.total,
            data: result.brands
        });
    } catch (error) {
        console.error('Error fetching brands data:', error);
        res.status(500).json({ error: 'Failed to fetch brands data' });
    }
}

/**
 * Show create brand form
 */
export async function create(req: Request, res: Response): Promise<void> {
    try {
        const nextOrder = await BrandService.getNextSortOrder();
        console.log("rendering create form")
        res.render('modules/brands/form.njk', {
            pageTitle: 'Add Brand',
            pageDescription: 'Create a new brand',
            currentPage: 'brands',
            formData: { sortOrder: nextOrder },
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Brands', url: '/brands' },
                { text: 'Add Brand', url: '/brands/add' }
            ],
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error rendering brand create form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Store new brand
 */
export async function store(req: Request, res: Response): Promise<void> {
    try {
        const { name, slug, description, website, seoTitle, seoDescription, seoKeywords, isActive, isFeatured, sortOrder } = req.body;
        let isExisting = await BrandService.brandExists({ slug, name });
        if (isExisting) {
            req.flash('error', 'Brand already exists');
            return redirectWithFlash(req, res, '/brands/add');
        }

        // Handle sorting logic for new insert
        const desiredOrder = sortOrder ? parseInt(sortOrder) : await BrandService.getNextSortOrder();
        // Shift existing items if we are inserting in the middle
        await BrandService.shiftOrdersForInsert(desiredOrder);

        const brand = await BrandService.createBrand({
            name,
            slug,
            description,
            website,
            seoTitle,
            seoDescription,
            seoKeywords,
            isActive: isActive === 'on' || isActive === true,
            isFeatured: isFeatured === 'on' || isFeatured === true,
            sortOrder: desiredOrder
        });
        console.log("brand added:", brand);
        if (!brand) {
            req.flash('error', 'Failed to create brand');
            return redirectWithFlash(req, res, '/brands/add');
        }
        req.flash('success', 'Brand created successfully');
        return redirectWithFlash(req, res, '/brands');
    } catch (error) {
        console.error('Error creating brand:', error);
        req.flash('error', 'Failed to create brand');
        return redirectWithFlash(req, res, '/brands/add');
    }
}

/**
 * Show edit brand form
 */
export async function edit(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Brand id is required');
            return res.redirect('/brands');
        }
        const brand = await BrandService.findBrandById(id);

        if (!brand) {
            req.flash('error', 'Brand not found');
            return res.redirect('/brands');
        }

        res.render('modules/brands/form.njk', {
            pageTitle: 'Edit Brand',
            pageDescription: 'Edit brand information',
            currentPage: 'brands',
            brand,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Brands', url: '/brands' },
                { text: 'Edit Brand', url: `/brands/${id}/edit` }
            ]
        });
    } catch (error) {
        console.error('Error rendering brand edit form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Update brand
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        console.log("update req.body", req.body);
        const { name, slug, description, website, seoTitle, seoDescription, seoKeywords, isActive, isFeatured, sortOrder } = req.body;
        if (!id) {
            req.flash('error', 'Brand id is required');
            return res.redirect(`/brands/${id}/edit`);
        }
        const currentBrand = await BrandService.findBrandById(id);
        if (!currentBrand) {
            req.flash("error", "Brand not found");
            return redirectWithFlash(req, res, `/brands/${id}/edit`);
        }

        // Handle reordering if sortOrder changed
        let newOrder = currentBrand.sortOrder;
        if (sortOrder !== undefined && sortOrder !== null && sortOrder !== '') {
            newOrder = parseInt(sortOrder);
        }

        const oldOrder = currentBrand.sortOrder;

        await BrandService.reorderOnUpdate(id, newOrder, oldOrder);

        let brand = await BrandService.updateBrandById(id, {
            name,
            slug,
            description,
            website,
            seoTitle,
            seoDescription,
            seoKeywords,
            isActive: isActive === 'on' || isActive === true,
            isFeatured: isFeatured === 'on' || isFeatured === true,
            sortOrder: newOrder
        });
        if (!brand) {
            req.flash('error', 'Failed to update brand');
            return redirectWithFlash(req, res, `/brands/${id}/edit`);
        }
        req.flash('success', 'Brand updated successfully');
        return redirectWithFlash(req, res, `/brands`);
    } catch (error) {
        console.error('Error updating brand:', error);
        req.flash('error', 'Failed to update brand');
        return redirectWithFlash(req, res, `/brands`);
    }
}

/**
 * Delete brand
 */
export async function destroy(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Brand id is required');
            return res.redirect('/brands');
        }
        const brand = await BrandService.findBrandById(id);
        if (!brand) {
            req.flash("error", "Brand not found");
            return;
        }

        const deletedOrder = brand.sortOrder;
        await BrandService.deleteBrandById(id);

        // Re-sequence remaining items
        await BrandService.reorderOnDelete(deletedOrder);
        await BrandService.updateBrandById(id, { isActive: false, isDeleted: true })

        res.json({
            status: true,
            message: 'Brand deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting brand:', error);
        req.flash('error', 'Failed to delete brand');
        return redirectWithFlash(req, res, `/brands`);
    }
}



/**
 * Toggle brand status
 */
export async function toggleStatus(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (!id) {
            req.flash('error', 'Brand id is required');
            return redirectWithFlash(req, res, "/brands")
        }
        let updatedBrand = await BrandService.updateBrandById(id, { isActive })
        if (!updatedBrand) {
            req.flash("error", "Error in update")
            return redirectWithFlash(req, res, "/brands")
        }
        res.json({
            status: true,
            message: `Brand ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error toggling brand status:', error);
        req.flash("error", "Something went wrong");
        return redirectWithFlash(req, res, "/brands")
    }
}

/**
 * Bulk actions
 */
export async function bulkAction(req: Request, res: Response): Promise<void> {
    try {
        const { action, brandIds } = req.body;

        if (Array.isArray(brandIds) && brandIds.length < 1) {
            req.flash("error", "Brand Ids are required")
            return redirectWithFlash(req, res, "/brands")
        }

        let message = '';
        let success = true;

        switch (action) {
            case 'activate':
                await BrandService.bulkUpdate(brandIds, { isActive: true });
                message = `${brandIds.length} brands into activated successfully`;
                break;
            case 'deactivate':
                await BrandService.bulkUpdate(brandIds, { isActive: false });
                message = `${brandIds.length} brands deactivated successfully`;
                break;
            case 'feature':
                await BrandService.bulkUpdate(brandIds, { isFeatured: true });
                message = `${brandIds.length} brands marked as featured successfully`;
                break;
            case 'unfeature':
                await BrandService.bulkUpdate(brandIds, { isFeatured: false });
                message = `${brandIds.length} brands removed from featured successfully`;
                break;
            case 'delete':
                // For bulk delete, we'll use soft delete to avoid complex reordering logic for now
                // Ideally, we should loop and robustly reorder, but soft delete is safer for bulk ops
                await BrandService.bulkUpdate(brandIds, { isDeleted: true, isActive: false });
                message = `${brandIds.length} brands deleted successfully`;
                break;
            default:
                success = false;
                message = 'Invalid action';
        }

        if (success) {
            res.json({ status: true, message });
        } else {
            res.status(400).json({ status: false, message });
        }

    } catch (error) {
        console.error('Error in bulk action:', error);
        req.flash("error", "Something went wrong");
        return redirectWithFlash(req, res, "/brands")
    }
}

export async function viewPage(req: Request, res: Response): Promise<void> {
    try {
        let id = req.params.id;
        if (!id) {
            req.flash('error', 'Brand id is required');
            return redirectWithFlash(req, res, '/brands');
        }
        const brand = await BrandService.findBrandById(id);
        if (!brand) {
            req.flash('error', 'Brand not found');
            return redirectWithFlash(req, res, '/brands');
        }
        res.render('modules/brands/view', {
            pageTitle: 'View Brand',
            pageDescription: 'View brand information',
            currentPage: 'brands',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Brands', url: '/brands' },
                { text: 'View Brand', url: `/brands/${id}/view` }
            ],
            brand,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error in view page:', error);
        req.flash('error', 'Failed to view page');
        return redirectWithFlash(req, res, '/brands');
    }
}

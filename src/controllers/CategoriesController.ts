import { type Request, type Response } from 'express';
import * as CategoryService from '../services/category';
import { MAIN_CATEGORIES_ENUM } from '../constant/static';
import { redirectWithFlash } from './index.js';

// ==========================================
// Main Categories Controller
// ==========================================

export async function mainIndex(req: Request, res: Response): Promise<void> {
    try {
        res.render('modules/categories/main/index.njk', {
            pageTitle: 'Main Categories',
            pageDescription: 'Manage main product categories',
            currentPage: 'categories',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' },
                { text: 'Main Categories', url: '/categories/main' }
            ],
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error rendering main categories page:', error);
        res.status(500).render('errors/500.njk');
    }
}


export async function mainIndexData(req: Request, res: Response): Promise<void> {
    try {
        const { draw, start, length, search, order, columns, status } = req.body;
        const limit = parseInt(length);
        const skip = parseInt(start);

        const query: any = {};
        if (search && search.value) {
            query.$or = [
                { name: { $regex: search.value, $options: 'i' } },
                { slug: { $regex: search.value, $options: 'i' } }
            ];
        }

        if (status) query.isActive = status === 'active';

        const sort: any = {};
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const dir = order[0].dir === 'asc' ? 1 : -1;
            const columnName = columns[columnIndex].name;

            if (['name', 'slug', 'sortOrder', 'createdAt'].includes(columnName)) {
                sort[columnName] = dir;
            } else {
                sort.sortOrder = 1;
            }
        } else {
            sort.sortOrder = 1;
        }

        const { mainCategories, total } = await CategoryService.findMainCategories(query, {
            skip,
            limit,
            sort,
            select: "_id name slug isActive sortOrder createdAt image"
        });

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: total,
            recordsFiltered: total,
            data: mainCategories
        });
    } catch (error) {
        console.error('Error fetching main categories data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}

/**
 * Show create main category form
 */
export async function mainCreate(req: Request, res: Response): Promise<void> {
    try {
        res.render('modules/categories/main/form.njk', {
            pageTitle: 'Add Main Category',
            currentPage: 'categories',
            formData: req.body || {},
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' },
                { text: 'Main Categories', url: '/categories/main' },
                { text: 'Add', url: '/categories/main/add' }
            ],
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error rendering main category create form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Store new main category
 */
export async function mainStore(req: Request, res: Response): Promise<void> {
    try {
        const data = req.body;

        await CategoryService.createMainCategory(data);

        req.flash('success', 'Main category created successfully');
        return redirectWithFlash(req, res, '/categories/main');
    } catch (error) {
        console.error('Error creating main category:', error);
        req.flash('error', (error as Error).message);
        return redirectWithFlash(req, res, '/categories/main/add');
    }
}

/**
 * Show edit main category form
 */
export async function mainEdit(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Main category not found');
            return redirectWithFlash(req, res, '/categories/main');
        }
        const mainCategory = await CategoryService.findMainCategoryById(id);

        if (!mainCategory) {
            req.flash('error', 'Main category not found');
            return redirectWithFlash(req, res, '/categories/main');
        }

        res.render('modules/categories/main/form.njk', {
            pageTitle: 'Edit Main Category',
            currentPage: 'categories',
            mainCategory,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' },
                { text: 'Main Categories', url: '/categories/main' },
                { text: 'Edit', url: `/categories/main/${id}/edit` }
            ],
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error rendering main category edit form:', error);
        return res.status(500).render('errors/500.njk');
    }
}

/**
 * Update main category
 */
export async function mainUpdate(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = req.body;
        if (!id) {
            req.flash('error', 'Main category not found');
            return redirectWithFlash(req, res, '/categories/main');
        }
        await CategoryService.updateMainCategoryById(id, data);

        req.flash('success', 'Main category updated successfully');
        return redirectWithFlash(req, res, '/categories/main');
    } catch (error) {
        console.error('Error updating main category:', error);
        req.flash('error', (error as Error).message);
        return redirectWithFlash(req, res, `/categories/main/${req.params.id}/edit`);
    }
}

/**
 * Delete main category
 */
export async function mainDestroy(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Main category not found');
            return redirectWithFlash(req, res, '/categories/main');
        }
        await CategoryService.deleteMainCategoryById(id);


        req.flash('success', 'Main category deleted successfully');
        return redirectWithFlash(req, res, '/categories/main');

    } catch (error) {
        console.error('Error deleting main category:', error);
        req.flash('error', (error as Error).message);
        return redirectWithFlash(req, res, '/categories/main');
    }
}

/**
 * Toggle main category status
 */
export async function mainToggleStatus(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Main category not found');
            return redirectWithFlash(req, res, '/categories/main');
        }
        const { isActive } = req.body;

        await CategoryService.updateMainCategoryById(id, { isActive });

        req.flash('success', `Main category ${isActive ? 'activated' : 'deactivated'} successfully`);
        return redirectWithFlash(req, res, '/categories/main');
    } catch (error) {
        console.error('Error toggling status:', error);
        req.flash('error', (error as Error).message);
        return redirectWithFlash(req, res, '/categories/main');
    }
}

/**
 * Bulk actions for main categories
 */
export async function mainBulkAction(req: Request, res: Response): Promise<void> {
    try {
        const { action, ids } = req.body;
        let message = '';

        switch (action) {
            case 'activate':
                await CategoryService.updateMainCategoryByQuery({ _id: { $in: ids } }, { isActive: true });
                message = 'Selected categories activated successfully';
                break;
            case 'deactivate':
                await CategoryService.updateMainCategoryByQuery({ _id: { $in: ids } }, { isActive: false });
                message = 'Selected categories deactivated successfully';
                break;
            case 'delete':
                await CategoryService.deleteMainCategoryByQuery({ _id: { $in: ids }, isActive: false });
                message = 'Selected categories deleted successfully';
                break;
        }

        req.flash('success', message);
        return redirectWithFlash(req, res, '/categories/main');
    } catch (error) {
        console.error('Error in bulk action:', error);
        req.flash('error', (error as Error).message);
        return redirectWithFlash(req, res, '/categories/main');
    }
}


// ==========================================
// Sub Categories Controller
// ==========================================

/**
 * Show categories listing page
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
        const mainCategories = await CategoryService.findAllMainCategories();
        const parentCategories = await CategoryService.findAllParentCategories();

        res.render('modules/categories/index.njk', {
            pageTitle: 'Categories',
            pageDescription: 'Manage product categories',
            currentPage: 'categories',
            parentCategories,
            mainCategories,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' }
            ],
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error rendering categories page:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Show create category form
 */
export async function create(req: Request, res: Response): Promise<void> {
    try {
        let nextOrderNumber = await CategoryService.getNextSortOrder();
        const mainCategories = await CategoryService.findAllMainCategories();
        const parentCategories = await CategoryService.findAllParentCategories();
        console.log("nextOrderNumber", nextOrderNumber);
        res.render('modules/categories/form.njk', {
            pageTitle: 'Add Category',
            pageDescription: 'Create a new category',
            currentPage: 'categories',
            formData: { sortOrder: nextOrderNumber },
            parentCategories,
            mainCategories,
            query: req.query,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' },
                { text: 'Add Category', url: '/categories/add' }
            ],
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error rendering category create form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * GET DataTables data for Categories
 */
export async function indexData(req: Request, res: Response): Promise<void> {
    try {
        const { draw, start, length, search, order, columns, status, level, parentCategoryId, mainCategoryId } = req.body;
        const limit = parseInt(length);
        const skip = parseInt(start);

        const query: any = { isDeleted: false };
        if (search && search.value) {
            query.$or = [
                { name: { $regex: search.value, $options: 'i' } },
                { slug: { $regex: search.value, $options: 'i' } }
            ];
        }

        // Custom filters
        if (status) query.isActive = status === 'active';
        if (parentCategoryId) query.parentCategory = parentCategoryId;
        if (level) query.level = level;
        if (mainCategoryId) query.mainCategory = mainCategoryId;


        // Sorting
        const sort: any = {};
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const dir = order[0].dir === 'asc' ? 1 : -1;
            const columnName = columns[columnIndex].name;

            if (['name', 'sortOrder', 'createdAt'].includes(columnName)) {
                sort[columnName] = dir;
            } else {
                sort.sortOrder = 1;
            }
        } else {
            sort.sortOrder = 1;
        }

        const { categories, total } = await CategoryService.findCategories(query, {
            skip,
            limit,
            sort,
            select: "_id name slug isActive sortOrder createdAt image mainCategoryName parentCategoryName",

        });

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: total,
            recordsFiltered: total,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories data:', error);
        res.status(500).json({ error: 'Failed to fetch categories data' });
    }
}

/**
 * Store new category
 */
export async function store(req: Request, res: Response): Promise<void> {
    try {
        const { name, mainCategory, parentCategory } = req.body;

        // Fetch names for denormalization
        let mainCategoryName = '';
        if (mainCategory) {
            const mc = await CategoryService.findMainCategoryById(mainCategory);
            if (mc) mainCategoryName = mc.name;
        }

        let parentCategoryName = '';
        let level = 0;
        if (parentCategory) {
            const pc = await CategoryService.findCategoryById(parentCategory);
            if (pc) {
                parentCategoryName = pc.name;
                level = (pc.level || 0) + 1;
            }
        }

        // Handle sorting logic for new insert
        const desiredOrder = req.body.sortOrder ? parseInt(req.body.sortOrder) : await CategoryService.getNextSortOrder();
        // Prepare data with denormalized names and calculated level
        const categoryData = {
            ...req.body,
            mainCategoryName,
            parentCategoryName,
            level,
            isActive: req.body.isActive === 'on' || req.body.isActive === true,
            isFeatured: req.body.isFeatured === 'on' || req.body.isFeatured === true,
            sortOrder: desiredOrder
        };

        if (!parentCategory) {
            delete categoryData.parentCategory;
        }

        await CategoryService.createCategory(categoryData);

        req.flash('success', 'Category created successfully');
        redirectWithFlash(req, res, '/categories');
    } catch (error) {
        console.error('Error creating category:', error);
        req.flash('error', (error as Error).message);
        redirectWithFlash(req, res, '/categories/add');
    }
}

/**
 * Show edit category form
 */
export async function edit(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Invalid category ID');
            return redirectWithFlash(req, res, '/categories');
        }
        const category = await CategoryService.findCategoryById(id);
        console.log("category", category);
        const mainCategories = await CategoryService.findAllMainCategories();

        const parentCategories = await CategoryService.findAllCategories();

        res.render('modules/categories/form.njk', {
            pageTitle: 'Edit Category',
            pageDescription: 'Edit category information',
            currentPage: 'categories',
            category,
            parentCategories,
            mainCategories,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' },
                { text: 'Edit Category', url: `/categories/${id}/edit` }
            ],
            errors: req.flash('errors'),
            success: req.flash('success'),
        });
    } catch (error) {
        console.error('Error rendering category edit form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Update category
 */
export async function update(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            req.flash('error', 'Invalid category ID');
            return redirectWithFlash(req, res, '/categories');
        }
        const { mainCategory, parentCategory } = req.body;

        let currentCategory = await CategoryService.findCategoryById(id);
        if (!currentCategory) {
            req.flash('error', 'Invalid category ID');
            return redirectWithFlash(req, res, '/categories');
        }
        let updateData: any = { ...req.body, isActive: req.body.isActive === 'on' || req.body.isActive === true, isFeatured: req.body.isFeatured === 'on' || req.body.isFeatured === true, sortOrder: req.body.sortOrder };

        if (mainCategory) {
            const mc = await CategoryService.findMainCategoryById(mainCategory);
            if (mc) updateData.mainCategoryName = mc.name;
        }

        if (parentCategory) {
            const pc = await CategoryService.findCategoryById(parentCategory);
            if (pc) {
                updateData.parentCategoryName = pc.name;
                updateData.level = (pc.level || 0) + 1;
            }
        } else {
            updateData.parentCategory = null;
            updateData.parentCategoryName = null;
            updateData.level = 0;
        }

        // Sorting & Status Logic
        const wasActive = currentCategory.isActive;
        const isActive = updateData.isActive;
        let newOrder = updateData.sortOrder !== undefined && updateData.sortOrder !== null && updateData.sortOrder !== ''
            ? parseInt(updateData.sortOrder)
            : currentCategory.sortOrder;

        const activeCount = await CategoryService.countCategories({ isActive: true });

        if (wasActive && isActive) {
            // Active -> Active: Regular Reorder
            // Clamp newOrder to activeCount (since we are part of the count, max index is count)
            if (newOrder > activeCount) newOrder = activeCount;
            if (newOrder < 1) newOrder = 1;

            const oldOrder = currentCategory.sortOrder;
            if (newOrder !== oldOrder) {
                await CategoryService.reorderOnUpdate(id, newOrder, oldOrder);
                updateData.sortOrder = newOrder;
            }
        } else if (!wasActive && isActive) {
            // Inactive -> Active: Treat as efficient Insert
            // If explicit order provided, use it (clamped to count + 1). Else append to end.
            const nextOrder = activeCount + 1;
            if (!updateData.sortOrder) {
                newOrder = nextOrder;
            } else {
                if (newOrder > nextOrder) newOrder = nextOrder;
                if (newOrder < 1) newOrder = 1;
            }

            // Shift items down to make space if inserting in middle
            if (newOrder < nextOrder) {
                await CategoryService.shiftOrdersForInsert(newOrder); // This function shifts >= newOrder UP (+1)
            }
            updateData.sortOrder = newOrder;

        } else if (wasActive && !isActive) {
            // Active -> Inactive: Treat as Delete from order list
            await CategoryService.reorderOnDelete(currentCategory.sortOrder);
            updateData.sortOrder = 0; // Or keep it? Usually 0 or null for inactive
        }
        // Inactive -> Inactive: No sorting changes needed

        await CategoryService.updateCategoryById(id, updateData);

        req.flash('success', 'Category updated successfully');
        redirectWithFlash(req, res, '/categories');
    } catch (error) {
        console.error('Error updating category:', error);
        req.flash('error', (error as Error).message);
        redirectWithFlash(req, res, `/categories/${req.params.id}/edit`);
    }
}

/**
 * Delete category
 */
export async function destroy(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(404).json({ status: false, message: 'Invalid category ID' });
        }
        await CategoryService.updateCategoryById(id, { isDeleted: true });
        return res.status(200).json({ status: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ status: false, message: 'Failed to delete category' });
    }
}

/**
 * Toggle category status
 */
export async function toggleStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(404).json({ status: false, message: 'Invalid category ID' });
        }
        const { isActive } = req.body;

        await CategoryService.updateCategoryById(id, { isActive });

        return res.status(200).json({ status: true, message: `Category ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('Error toggling category status:', error);
        return res.status(500).json({ status: false, message: 'Failed to update category status' });
    }
}

/**
 * Bulk actions
 */
export async function bulkAction(req: Request, res: Response): Promise<void> {
    try {
        const { action, ids } = req.body;
        let message = '';

        switch (action) {
            case 'activate':
                await CategoryService.updateManyCategoryByQuery({ _id: { $in: ids } }, { isActive: true });
                message = 'Selected categories activated successfully';
                break;
            case 'deactivate':
                await CategoryService.updateManyCategoryByQuery({ _id: { $in: ids } }, { isActive: false });
                message = 'Selected categories deactivated successfully';
                break;
            case 'delete':
                await CategoryService.updateManyCategoryByQuery({ _id: { $in: ids } }, { isDeleted: true });
                message = 'Selected categories deleted successfully';
                break;
        }

        res.json({
            status: true,
            message
        });
    } catch (error) {
        console.error('Error in bulk action:', error);
        res.status(400).json({
            status: false,
            message: 'Failed to perform bulk action'
        });
    }
}

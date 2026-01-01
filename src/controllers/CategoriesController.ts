import { type Request, type Response } from 'express';

/**
 * Categories Controller
 * Handles CRUD operations for category management
 */

/**
 * Show categories listing page
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
        // TODO: Fetch categories from database
        const stats = {
            totalCategories: 87,
            mainCategories: 12,
            activeCategories: 75,
            categoriesWithProducts: 63,
            categoriesGrowth: '+5.4%'
        };

        // TODO: Fetch parent categories for filter dropdown
        const parentCategories = [
            { _id: '1', name: 'Electronics' },
            { _id: '2', name: 'Clothing' },
            { _id: '3', name: 'Home & Garden' }
        ];

        // TODO: Build category tree for tree view
        const categoryTree = [
            {
                _id: '1',
                name: 'Electronics',
                level: 0,
                isActive: true,
                subcategoriesCount: 5
            }
        ];

        res.render('modules/categories/index.njk', {
            pageTitle: 'Categories',
            pageDescription: 'Manage product categories',
            currentPage: 'categories',
            stats,
            categories: [], // TODO: Pass actual categories data
            parentCategories,
            categoryTree,
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
 * Show create category form
 */
export async function create(req: Request, res: Response): Promise<void> {
    try {
        // TODO: Fetch parent categories for dropdown
        const parentCategories = [
            { _id: '1', name: 'Electronics', level: 0 },
            { _id: '2', name: 'Clothing', level: 0 },
            { _id: '3', name: 'Smartphones', level: 1 }
        ];

        res.render('modules/categories/form.njk', {
            pageTitle: 'Add Category',
            pageDescription: 'Create a new category',
            currentPage: 'categories',
            formData: req.body || {},
            parentCategories,
            query: req.query,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' },
                { text: 'Add Category', url: '/categories/add' }
            ]
        });
    } catch (error) {
        console.error('Error rendering category create form:', error);
        res.status(500).render('errors/500.njk');
    }
}

/**
 * Store new category
 */
export async function store(req: Request, res: Response): Promise<void> {
    try {
        // TODO: Validate and store category data
        const { name, slug, description, parentCategory, seoTitle, seoDescription, seoKeywords, isActive, sortOrder } = req.body;
        
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                success: true,
                message: 'Category created successfully',
                redirectUrl: '/categories'
            });
        } else {
            res.redirect('/categories');
        }
    } catch (error) {
        console.error('Error creating category:', error);
        
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.status(400).json({
                success: false,
                message: 'Failed to create category',
                errors: { general: (error as Error).message }
            });
        } else {
            res.redirect('/categories/add');
        }
    }
}

/**
 * Show edit category form
 */
export async function edit(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        
        // TODO: Fetch category by ID from database
        const category = {
            _id: id,
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic devices and accessories',
            image: null,
            parentCategory: null,
            level: 0,
            isActive: true,
            sortOrder: 0,
            seoTitle: 'Electronics - Buy Latest Electronic Devices',
            seoDescription: 'Shop the latest electronic devices and accessories',
            seoKeywords: ['electronics', 'devices', 'technology'],
            productsCount: 125,
            subcategoriesCount: 8,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // TODO: Fetch parent categories (excluding current category and its children)
        const parentCategories = [
            { _id: '2', name: 'Clothing', level: 0 },
            { _id: '3', name: 'Home & Garden', level: 0 }
        ];

        res.render('modules/categories/form.njk', {
            pageTitle: 'Edit Category',
            pageDescription: 'Edit category information',
            currentPage: 'categories',
            category,
            parentCategories,
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'Categories', url: '/categories' },
                { text: 'Edit Category', url: `/categories/${id}/edit` }
            ]
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
        // TODO: Validate and update category data
        
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                success: true,
                message: 'Category updated successfully',
                redirectUrl: '/categories'
            });
        } else {
            res.redirect('/categories');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.status(400).json({
                success: false,
                message: 'Failed to update category',
                errors: { general: (error as Error).message }
            });
        } else {
            res.redirect(`/categories/${req.params.id}/edit`);
        }
    }
}

/**
 * Delete category
 */
export async function destroy(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        // TODO: Delete category and handle cascading deletes
        
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } else {
            res.redirect('/categories');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.status(400).json({
                success: false,
                message: 'Failed to delete category'
            });
        } else {
            res.redirect('/categories');
        }
    }
}

/**
 * Get tree view data
 */
export async function tree(req: Request, res: Response): Promise<void> {
    try {
        // TODO: Build category tree based on filters
        const treeHtml = `
            <div class="category-tree-item" data-category-id="1">
                <div class="d-flex align-items-center justify-content-between border rounded p-3 mb-2">
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-3">
                            <span class="avatar-initial rounded bg-label-primary">E</span>
                        </div>
                        <div>
                            <h6 class="mb-1">Electronics</h6>
                            <small class="text-muted d-flex align-items-center gap-2">
                                <span>electronics</span>
                                <span class="badge bg-label-info">Level 0</span>
                                <span class="badge bg-label-warning">25 Products</span>
                            </small>
                        </div>
                    </div>
                    <div class="dropdown">
                        <button type="button" class="btn btn-sm p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                            <i class="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="/categories/1/edit">
                                <i class="bx bx-edit-alt me-1"></i> Edit
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        res.json({
            success: true,
            html: treeHtml
        });
    } catch (error) {
        console.error('Error fetching category tree:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load category tree'
        });
    }
}

/**
 * DataTable AJAX endpoint
 */
export async function datatable(req: Request, res: Response): Promise<void> {
    try {
        // TODO: Implement server-side DataTable processing
        const response = {
            draw: parseInt(req.body.draw) || 1,
            recordsTotal: 87,
            recordsFiltered: 87,
            data: [
                {
                    checkbox: '<input type="checkbox" class="row-checkbox" value="1">',
                    name: 'Electronics',
                    level: '<span class="badge bg-label-info">Level 0</span>',
                    parent: '<span class="text-muted">Root Category</span>',
                    productsCount: '<span class="badge bg-label-secondary">125</span>',
                    status: '<span class="badge bg-label-success">Active</span>',
                    createdAt: 'Dec 10, 2023',
                    actions: '<div class="dropdown">...</div>'
                }
            ]
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error in categories datatable:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Toggle category status
 */
export async function toggleStatus(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        // TODO: Update category status in database
        
        res.json({
            success: true,
            message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error toggling category status:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update category status'
        });
    }
}

/**
 * Bulk actions
 */
export async function bulkAction(req: Request, res: Response): Promise<void> {
    try {
        const { action, categoryIds } = req.body;
        
        // TODO: Implement bulk actions
        
        let message = '';
        switch (action) {
            case 'activate':
                message = `${categoryIds.length} categories activated successfully`;
                break;
            case 'deactivate':
                message = `${categoryIds.length} categories deactivated successfully`;
                break;
            case 'delete':
                message = `${categoryIds.length} categories deleted successfully`;
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

export function showProducts(req: Request, res: Response): void {
  try {
    const categoryId = req.params.id;
    
    res.render('modules/categories/products.njk', {
      pageTitle: 'Category Products',
      pageDescription: 'Products in this category',
      currentPage: 'categories',
      breadcrumbs: [
        { text: 'Dashboard', url: '/dashboard' },
        { text: 'Categories', url: '/categories' },
        { text: 'Products', url: `/categories/${categoryId}/products` }
      ],
      categoryId,
      // Mock products data
      products: [
        { id: '1', name: 'Product 1', sku: 'SKU001', price: 99.99, stock: 50, status: 'active' },
        { id: '2', name: 'Product 2', sku: 'SKU002', price: 149.99, stock: 25, status: 'active' },
      ],
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error showing category products:', error);
    res.status(500).render('errors/500.njk');
  }
}

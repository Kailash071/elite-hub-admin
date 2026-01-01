import { type Request, type Response } from 'express';
import { ProductService, CategoryService, BrandService } from '../services/index.js';

/**
 * Products Controller
 * Handles product management views and logic
 */

/**
 * Show products listing page
 */
export async function index(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters
      const {
        page = 1,
        limit = 25,
        search = '',
        status = '',
        category = '',
        brand = '',
        stockStatus = '',
        featured,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query based on filters
      const query: any = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      if (stockStatus) {
        query.stockStatus = stockStatus;
      }

      if (featured === 'true') {
        query.isFeatured = true;
      } else if (featured === 'false') {
        query.isFeatured = false;
      }

      if (category) {
        query.$or = [
          { mainCategory: category },
          { subCategories: category }
        ];
      }

      if (brand) {
        query.brand = brand;
      }

      // Get sort options
      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Get products using simple service
      const result = await ProductService.findProducts(query, { 
        page: Number(page), 
        limit: Number(limit),
        sort: sortOptions 
      });

      // Get filter data
      const [categories, brands] = await Promise.all([
        CategoryService.findMainCategories(),
        BrandService.findActiveBrands()
      ]);

      const totalPages = Math.ceil(result.total / Number(limit));

      const data = {
        products: result.products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        },
        filters: {
          search: search as string,
          status: status as string,
          category: category as string,
          brand: brand as string,
          stockStatus: stockStatus as string,
          featured: featured as string
        },
        availableFilters: {
          categories: categories.map(cat => ({ _id: cat._id, name: cat.name })),
          brands: brands.map(brand => ({ _id: brand._id, name: brand.name }))
        },
        pageTitle: 'Products',
        pageDescription: 'Manage your product catalog',
        currentPage: 'products',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Products', url: '/products' }
        ]
      };

      res.render('modules/products/index.njk', data);
    } catch (error) {
      console.error('Error rendering products page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show create product form
 */
export async function create(req: Request, res: Response): Promise<void> {
    try {
      // Get categories and brands for dropdowns
      const [categories, brands] = await Promise.all([
        CategoryService.findMainCategories(),
        BrandService.findActiveBrands()
      ]);

      res.render('modules/products/create.njk', {
        categories,
        brands,
        pageTitle: 'Add New Product',
        pageDescription: 'Create a new product in your catalog',
        currentPage: 'products',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Products', url: '/products' },
          { text: 'Add New Product', url: '/products/new' }
        ]
      });
    } catch (error) {
      console.error('Error rendering create product page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show edit product form
 */
export async function edit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).render('errors/400.njk', {
          message: 'Product ID is required'
        });
        return;
      }

      // Get product and dropdown data
      const [product, categories, brands] = await Promise.all([
        ProductService.findProductById(id),
        CategoryService.findMainCategories(),
        BrandService.findActiveBrands()
      ]);

      if (!product) {
        res.status(404).render('errors/404.njk', {
          message: 'Product not found'
        });
        return;
      }

      res.render('modules/products/edit.njk', {
        product,
        categories,
        brands,
        pageTitle: `Edit ${product.name}`,
        pageDescription: 'Update product information',
        currentPage: 'products',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Products', url: '/products' },
          { text: product.name, url: `/products/${id}/edit` }
        ]
      });
    } catch (error) {
      console.error('Error rendering edit product page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

/**
 * Show product details
 */
export async function show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).render('errors/400.njk', {
          message: 'Product ID is required'
        });
        return;
      }

      // Get product using simple service
      const product = await ProductService.findProductById(id);

      if (!product) {
        res.status(404).render('errors/404.njk', {
          message: 'Product not found'
        });
        return;
      }

      res.render('modules/products/show.njk', {
        product: product,
        pageTitle: product.name,
        pageDescription: 'Product details and information',
        currentPage: 'products',
        breadcrumbs: [
          { text: 'Dashboard', url: '/dashboard' },
          { text: 'Products', url: '/products' },
          { text: product.name, url: `/products/${id}` }
        ]
      });
    } catch (error) {
      console.error('Error rendering product details page:', error);
      res.status(500).render('errors/500.njk');
    }
  }

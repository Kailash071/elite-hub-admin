import { type Request, type Response } from 'express';
import { ProductService, CategoryService, BrandService } from '../services/index.js';
import { redirectWithFlash } from './index.js';

export async function index(req: Request, res: Response): Promise<void> {
  try {
    const [categories, brands] = await Promise.all([
      CategoryService.findAllCategories(),
      BrandService.findActiveBrands()
    ]);

    res.render('modules/products/index.njk', {
      pageTitle: 'Products',
      pageDescription: 'Manage your product catalog',
      currentPage: 'products',
      categories,
      brands,
      breadcrumbs: [
        { text: 'Dashboard', url: '/dashboard' },
        { text: 'Products', url: '/products' }
      ],
      error: req.flash("error"),
      success: req.flash("success")
    });
  } catch (error) {
    console.error('Error rendering products page:', error);
    res.status(500).render('errors/500.njk');
  }
}
/**
 * DataTable AJAX endpoint for products
 */
export async function indexData(req: Request, res: Response): Promise<void> {
  try {
    const { draw, start, length, search, order: sortOrder, columns } = req.body;
    const { status, category, brand, stockStatus } = req.body; // Custom filters

    const page = (parseInt(start) / parseInt(length)) + 1;
    const limit = parseInt(length);

    const query: any = {};

    // Search
    if (search && search.value) {
      const searchTerm = search.value;
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { sku: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'tags': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Filters
    if (status) { // 'published', 'draft', 'archived' usually map to isActive boolean or status string
      // Assuming user input "published" maps to isActive: true? 
      // Or if your model supports a status field, use that.
      // Based on previous code: status === 'active' -> isActive: true.
      // But the view typically sends 'published', 'draft'. 
      // Let's check the view: "published", "draft", "archived".
      // And check model: isActive (bool), stockStatus.
      // If the user wants 'Published', let's assume isActive=true.
      if (status === 'published') query.isActive = true;
      else if (status === 'draft') query.isActive = false;
      // Archived might need a specific flag or reuse isActive=false
    }

    if (category) {
      query.$or = [
        { mainCategory: category },
        { subCategories: category }
      ];
    }
    if (brand) query.brand = brand;

    // stockStatus matches model field directly usually
    if (stockStatus) query.stockStatus = stockStatus;

    // Sorting
    const sort: any = {};
    if (sortOrder && sortOrder.length > 0) {
      const columnIndex = sortOrder[0].column;
      const columnDir = sortOrder[0].dir;
      const columnName = columns[columnIndex].data;

      // Map data names to DB fields if needed, or use direct
      const fieldMap: { [key: string]: string } = {
        'name': 'name',
        'sku': 'sku',
        'price': 'price',
        'stockQuantity': 'stockQuantity',
        'createdAt': 'createdAt'
      };

      if (fieldMap[columnName]) {
        sort[fieldMap[columnName]] = columnDir === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = -1;
      }
    } else {
      sort.createdAt = -1;
    }

    const { products, total } = await ProductService.findProducts(query, {
      page,
      limit,
      sort
    });

    const data = products.map((product: any) => ({
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      category: product.mainCategory, // Populated object or ID
      price: product.price,
      stock: product.stockQuantity,
      stockStatus: product.stockStatus,
      status: product.isActive ? 'published' : 'draft', // Mapping back for view
      isActive: product.isActive,
      createdAt: product.createdAt
    }));

    res.json({
      draw: parseInt(draw) || 1,
      recordsTotal: total,
      recordsFiltered: total,
      data
    });
  } catch (error) {
    console.error('Error in products datatable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Show create product form
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    // Get categories and brands for dropdowns
    const [categories, brands] = await Promise.all([
      CategoryService.findAllCategories(),
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
      ],
      error: req.flash("error"),
      success: req.flash("success")
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
      req.flash("error", "Product ID is required");
      return redirectWithFlash(req, res, "/products")
    }

    // Get product and dropdown data
    const [product, categories, brands] = await Promise.all([
      ProductService.findProductById(id),
      CategoryService.findAllCategories(),
      BrandService.findActiveBrands()
    ]);

    if (!product) {
      req.flash("error", "Product not found");
      return redirectWithFlash(req, res, "/products")
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
      ],
      error: req.flash("error"),
      success: req.flash("success")
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
      req.flash('error', 'Product ID is required');
      return redirectWithFlash(req, res, '/products');
    }

    // Get product using simple service
    const product = await ProductService.findProductById(id);

    if (!product) {
      req.flash('error', 'Product not found');
      return redirectWithFlash(req, res, '/products');
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
      ],
      error: req.flash("error"),
      success: req.flash("success")
    });
  } catch (error) {
    console.error('Error rendering product details page:', error);
    req.flash('error', 'Failed to render product details page');
    return redirectWithFlash(req, res, '/products');
  }
}
/**
 * Create new product
 */
export async function store(req: Request, res: Response): Promise<void> {
  try {
    const rawData = req.body;

    // Process form data
    const productData: any = {
      ...rawData,
      mainCategory: rawData.category, // Map category field
      // Convert checkboxes to boolean
      isActive: rawData.isActive === 'on',
      isFeatured: rawData.isFeatured === 'on',
      stockTracking: rawData.stockTracking === 'on',
      isNewLaunch: rawData.isNewLaunch === 'on',
      isOnSale: rawData.isOnSale === 'on',
    };

    // Generate slug if not provided
    if (!productData.slug && productData.name) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }

    // Process lists (tags, materials, collections)
    ['tags', 'materials', 'collections'].forEach(field => {
      if (typeof productData[field] === 'string') {
        productData[field] = productData[field].split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    });

    // Stock Status Logic
    if (productData.stockTracking) {
      const qty = Number(productData.stockQuantity) || 0;
      const threshold = Number(productData.lowStockThreshold) || 5;
      if (qty <= 0) productData.stockStatus = 'out_of_stock';
      else if (qty <= threshold) productData.stockStatus = 'low_stock';
      else productData.stockStatus = 'in_stock';
    } else {
      productData.stockStatus = 'in_stock'; // Default if not tracking
    }

    // Clean up numeric fields
    ['price', 'salePrice', 'costPrice', 'weight', 'stockQuantity', 'lowStockThreshold'].forEach(field => {
      if (productData[field]) productData[field] = Number(productData[field]);
    });

    await ProductService.createProduct(productData);

    req.flash('success', 'Product created successfully');
    return redirectWithFlash(req, res, '/products');
  } catch (error) {
    console.error('Error creating product:', error);
    req.flash('error', 'Failed to create product');
    return redirectWithFlash(req, res, '/products/new');
  }
}

/**
 * Update product
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      req.flash('error', 'Product ID is required');
      return redirectWithFlash(req, res, '/products');
    }

    const rawData = req.body;

    // Process form data
    const productData: any = {
      ...rawData,
      mainCategory: rawData.category || rawData.mainCategory, // Map category field if present
      // Convert checkboxes to boolean
      isActive: rawData.isActive === 'on' || rawData.isActive === true,
      isFeatured: rawData.isFeatured === 'on' || rawData.isFeatured === true,
      stockTracking: rawData.stockTracking === 'on' || rawData.stockTracking === true,
      isNewLaunch: rawData.isNewLaunch === 'on' || rawData.isNewLaunch === true,
      isOnSale: rawData.isOnSale === 'on' || rawData.isOnSale === true,
    };

    if (!productData.slug && productData.name) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }

    // Process lists (tags, materials, collections)
    ['tags', 'materials', 'collections'].forEach(field => {
      if (typeof productData[field] === 'string') {
        productData[field] = productData[field].split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    });

    // Stock Status Logic
    if (productData.stockTracking) {
      const qty = Number(productData.stockQuantity) || 0;
      const threshold = Number(productData.lowStockThreshold) || 5;
      if (qty <= 0) productData.stockStatus = 'out_of_stock';
      else if (qty <= threshold) productData.stockStatus = 'low_stock';
      else productData.stockStatus = 'in_stock';
    }

    // Clean up numeric fields
    ['price', 'salePrice', 'costPrice', 'weight', 'stockQuantity', 'lowStockThreshold'].forEach(field => {
      if (productData[field] !== undefined && productData[field] !== '') {
        productData[field] = Number(productData[field]);
      }
    });

    await ProductService.updateProductById(id, productData);

    req.flash('success', 'Product updated successfully');
    return redirectWithFlash(req, res, '/products');
  } catch (error) {
    console.error('Error updating product:', error);
    req.flash('error', 'Failed to update product');
    return redirectWithFlash(req, res, `/products/${req.params.id}/edit`);
  }
}

/**
 * Delete product
 */
export async function destroy(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'Product ID is required' });
      return;
    }
    await ProductService.updateProductById(id, { isDeleted: true, isActive: false });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
}

/**
 * Bulk Actions
 */
export async function bulkAction(req: Request, res: Response): Promise<void> {
  try {
    const { action, productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ success: false, message: 'No products selected' });
      return;
    }

    switch (action) {
      case 'delete':
        await ProductService.updateManyProducts(productIds, { isDeleted: true, isActive: false });
        res.json({ success: true, message: `${productIds.length} products deleted successfully` });
        break;
      case 'publish':
        await ProductService.bulkUpdateStatus(productIds, 'published');
        res.json({ success: true, message: `${productIds.length} products published successfully` });
        break;
      case 'draft':
        await ProductService.bulkUpdateStatus(productIds, 'draft');
        res.json({ success: true, message: `${productIds.length} products moved to draft` });
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk action' });
  }
}

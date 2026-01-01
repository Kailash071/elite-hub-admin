import { Product, type IProduct } from '../models/Product.js';

/**
 * Product CRUD Service
 * Simple database operations for Product model
 */

export const createProduct = async (productData: Partial<IProduct>) => {
  return await Product.create(productData);
};

export const findProductById = async (id: string) => {
  return await Product.findById(id)
    .populate('mainCategory', 'name slug description')
    .populate('subCategories', 'name slug description')
    .populate('brand', 'name slug description logo');
};

export const findProductBySlug = async (slug: string) => {
  return await Product.findOne({ slug })
    .populate('mainCategory', 'name slug')
    .populate('subCategories', 'name slug')
    .populate('brand', 'name slug');
};

export const findProductBySku = async (sku: string) => {
  return await Product.findOne({ sku: sku.toUpperCase() });
};

export const updateProductById = async (id: string, updateData: Partial<IProduct>) => {
  return await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    .populate('mainCategory', 'name slug')
    .populate('subCategories', 'name slug')
    .populate('brand', 'name slug');
};

export const deleteProductById = async (id: string) => {
  return await Product.findByIdAndDelete(id);
};

export const findProducts = async (query: any = {}, options: any = {}) => {
  const { page = 1, limit = 25, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;
  
  return {
    products: await Product.find(query)
      .populate('mainCategory', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('brand', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    total: await Product.countDocuments(query)
  };
};

export const countProducts = async (query: any = {}) => {
  return await Product.countDocuments(query);
};

export const productExists = async (query: any) => {
  return await Product.exists(query);
};

export const updateProductStock = async (id: string, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set') => {
  const product = await Product.findById(id);
  if (!product) return null;

  let newStock: number;
  switch (operation) {
    case 'add':
      newStock = product.stockQuantity + quantity;
      break;
    case 'subtract':
      newStock = Math.max(0, product.stockQuantity - quantity);
      break;
    default:
      newStock = quantity;
  }

  // Determine stock status
  let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  if (newStock === 0) {
    stockStatus = 'out_of_stock';
  } else if (newStock <= product.lowStockThreshold) {
    stockStatus = 'low_stock';
  } else {
    stockStatus = 'in_stock';
  }

  return await Product.findByIdAndUpdate(
    id,
    {
      stockQuantity: newStock,
      stockStatus,
      updatedAt: new Date()
    },
    { new: true }
  );
};

import { Category, type ICategory } from '../models/Category.js';

/**
 * Category CRUD Service
 * Simple database operations for Category model
 */

export const createCategory = async (categoryData: Partial<ICategory>) => {
  return await Category.create(categoryData);
};

export const findCategoryById = async (id: string) => {
  return await Category.findById(id).populate('parent', 'name slug');
};

export const findCategoryBySlug = async (slug: string) => {
  return await Category.findOne({ slug });
};

export const updateCategoryById = async (id: string, updateData: Partial<ICategory>) => {
  return await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const deleteCategoryById = async (id: string) => {
  return await Category.findByIdAndDelete(id);
};

export const findCategories = async (query: any = {}, options: any = {}) => {
  const { page = 1, limit = 25, sort = { name: 1 } } = options;
  const skip = (page - 1) * limit;
  
  return {
    categories: await Category.find(query)
      .populate('parent', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    total: await Category.countDocuments(query)
  };
};

export const findMainCategories = async () => {
  return await Category.find({ parent: null, isActive: true }).sort({ name: 1 });
};

export const findSubCategories = async (parentId: string) => {
  return await Category.find({ parent: parentId, isActive: true }).sort({ name: 1 });
};

export const countCategories = async (query: any = {}) => {
  return await Category.countDocuments(query);
};

export const categoryExists = async (query: any) => {
  return await Category.exists(query);
};

import { MainCategory, type IMainCategory } from '../models/MainCategory.js';
import { Category, type ICategory } from '../models/Category.js';
import type { PopulateOption } from 'mongoose';

export const createMainCategory = async (mainCategoryData: Partial<IMainCategory>) => {
  return await MainCategory.create(mainCategoryData);
};

export const findMainCategoryById = async (id: string) => {
  return await MainCategory.findById(id);
};

export const findMainCategoryByQuery = async (query: any, options: { select?: string } = {}) => {
  const q = MainCategory.findOne(query);
  if (options.select) {
    q.select(options.select);
  }
  return await q.lean();
};

export const findMainCategoryBySlug = async (slug: string, options: { select?: string } = {}) => {
  const query = MainCategory.findOne({ slug });
  if (options.select) {
    query.select(options.select);
  }
  return await query.lean();
};

export const updateMainCategoryById = async (id: string, updateData: Partial<IMainCategory>) => {
  return await MainCategory.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const updateMainCategoryByQuery = async (query: any, updateData: Partial<IMainCategory>) => {
  return await MainCategory.updateOne(query, updateData);
};

export const deleteMainCategoryById = async (id: string) => {
  return await MainCategory.findByIdAndDelete(id);
};

export const deleteMainCategoryByQuery = async (query: any) => {
  return await MainCategory.deleteOne(query);
};

export const findMainCategories = async (query: any = {}, options: { skip?: number, limit?: number, sort?: any, select?: string } = {}) => {
  const { skip = 0, limit = 25, sort = { name: 1 }, select = "" } = options;

  return {
    mainCategories: await MainCategory.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(select)
      .lean(),
    total: await MainCategory.countDocuments(query)
  };
};

export const findAllMainCategories = async () => {
  return await MainCategory.find().lean();
};

/**
 * Category CRUD Service
 * Simple database operations for Category model
 */

export const createCategory = async (categoryData: Partial<ICategory>) => {
  return await Category.create(categoryData);
};

export const findCategoryById = async (id: string) => {
  return await Category.findById(id).populate('parentCategory', 'name slug').lean();
};

export const findCategoryBySlug = async (slug: string) => {
  return await Category.findOne({ slug }).lean();
};

export const findCategoryByQuery = async (query: any, options: { select?: string, populate?: string } = {}) => {
  const q = Category.findOne(query);
  if (options.select) {
    q.select(options.select);
  }
  if (options.populate) {
    q.populate(options.populate);
  }
  return await q.lean();
};

export const updateCategoryById = async (id: string, updateData: Partial<ICategory>) => {
  return await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const updateCategoryByQuery = async (query: any, updateData: Partial<ICategory>) => {
  return await Category.updateOne(query, updateData);
};

export const updateManyCategoryByQuery = async (query: any, updateData: Partial<ICategory>) => {
  return await Category.updateMany(query, updateData);
};

export const deleteCategoryById = async (id: string) => {
  return await Category.findByIdAndDelete(id);
};

export const findCategories = async (query: any = {}, options: { skip?: number, limit?: number, sort?: any, select?: string, populate?: string } = {}) => {
  const { skip = 0, limit = 25, sort = { name: 1 }, select = "", populate = "" } = options;

  return {
    categories: await Category.find(query)
      .populate(populate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(select)
      .lean(),
    total: await Category.countDocuments(query)
  };
};

export const findSubCategories = async (parentId: string) => {
  return await Category.find({ parentCategory: parentId, isActive: true }).sort({ name: 1 });
};

export const countCategories = async (query: any = {}) => {
  return await Category.countDocuments(query);
};

export const categoryExists = async (query: any) => {
  return await Category.exists(query);
};

export const findAllCategories = async () => {
  return await Category.find().lean();
};

export const findAllSubCategories = async () => {
  return await Category.find({ level: 1 }).lean();
};

export const findAllParentCategories = async () => {
  return await Category.aggregate([
    {
      $match: { level: 0 }
    },
    {
      $lookup: {
        from: "categories",
        localField: "parentCategory",
        foreignField: "_id",
        as: "parentCategories"
      }
    },
    {
      $project: {
        _id: "$parentCategories._id",
        name: "$parentCategories.name",
        slug: "$parentCategories.slug"
      }
    }
  ]);
};

// Sorting & Ordering Services

export const getNextSortOrder = async () => {
  const lastCategory = await Category.findOne({ isActive: true }).sort({ sortOrder: -1 });
  return (lastCategory?.sortOrder || 0) + 1;
};

export const shiftOrdersForInsert = async (targetOrder: number) => {
  // Shift all brands with sortOrder >= targetOrder up by 1
  await Category.updateMany(
    { sortOrder: { $gte: targetOrder }, isActive: true },
    { $inc: { sortOrder: 1 } }
  );
};

export const reorderOnUpdate = async (id: string, newOrder: number, oldOrder: number) => {
  if (newOrder === oldOrder) return;

  if (newOrder < oldOrder) {
    // Moving up (e.g. 5 -> 2): Shift items in [newOrder, oldOrder - 1] UP (+1)
    await Category.updateMany(
      {
        _id: { $ne: id },
        sortOrder: { $gte: newOrder, $lt: oldOrder },
        isActive: true
      },
      { $inc: { sortOrder: 1 } }
    );
  } else {
    // Moving down (e.g. 2 -> 5): Shift items in [oldOrder + 1, newOrder] DOWN (-1)
    await Category.updateMany(
      {
        _id: { $ne: id },
        sortOrder: { $gt: oldOrder, $lte: newOrder },
        isActive: true
      },
      { $inc: { sortOrder: -1 } }
    );
  }
};

export const reorderOnDelete = async (deletedOrder: number) => {
  // Shift all brands with sortOrder > deletedOrder down by 1 to fill the gap
  await Category.updateMany(
    { sortOrder: { $gt: deletedOrder }, isActive: true },
    { $inc: { sortOrder: -1 } }
  );
};

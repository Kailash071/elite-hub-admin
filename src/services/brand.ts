import { Brand, type IBrand } from '../models/Brand.js';

/**
 * Brand CRUD Service
 * Simple database operations for Brand model
 */

export const createBrand = async (brandData: Partial<IBrand>) => {
  return await Brand.create(brandData);
};

export const findBrandById = async (id: string) => {
  return await Brand.findById(id);
};

export const findBrandBySlug = async (slug: string) => {
  return await Brand.findOne({ slug });
};

export const updateBrandById = async (id: string, updateData: Partial<IBrand>) => {
  return await Brand.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const deleteBrandById = async (id: string) => {
  return await Brand.findByIdAndDelete(id);
};

export const findBrands = async (query: any = {}, options: any = {}) => {
  const { page = 1, limit = 25, sort = { name: 1 } } = options;
  const skip = (page - 1) * limit;

  return {
    brands: await Brand.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    total: await Brand.countDocuments(query)
  };
};

export const findActiveBrands = async () => {
  return await Brand.find({ isActive: true }).sort({ name: 1 });
};

export const countBrands = async (query: any = {}) => {
  return await Brand.countDocuments(query);
};

export const brandExists = async (query: any) => {
  return await Brand.exists(query);
};

export const bulkUpdate = async (ids: string[], updateData: Partial<IBrand>) => {
  return await Brand.updateMany(
    { _id: { $in: ids }, isDeleted: false },
    { $set: updateData }
  );
};

// Sorting & Ordering Services

export const getNextSortOrder = async () => {
  const lastBrand = await Brand.findOne({ isDeleted: false }).sort({ sortOrder: -1 });
  return (lastBrand?.sortOrder || 0) + 1;
};

export const shiftOrdersForInsert = async (targetOrder: number) => {
  // Shift all brands with sortOrder >= targetOrder up by 1
  await Brand.updateMany(
    { sortOrder: { $gte: targetOrder }, isDeleted: false },
    { $inc: { sortOrder: 1 } }
  );
};

export const reorderOnUpdate = async (id: string, newOrder: number, oldOrder: number) => {
  if (newOrder === oldOrder) return;

  if (newOrder < oldOrder) {
    // Moving up (e.g. 5 -> 2): Shift items in [newOrder, oldOrder - 1] UP (+1)
    await Brand.updateMany(
      {
        _id: { $ne: id },
        sortOrder: { $gte: newOrder, $lt: oldOrder },
        isDeleted: false
      },
      { $inc: { sortOrder: 1 } }
    );
  } else {
    // Moving down (e.g. 2 -> 5): Shift items in [oldOrder + 1, newOrder] DOWN (-1)
    await Brand.updateMany(
      {
        _id: { $ne: id },
        sortOrder: { $gt: oldOrder, $lte: newOrder },
        isDeleted: false
      },
      { $inc: { sortOrder: -1 } }
    );
  }
};

export const reorderOnDelete = async (deletedOrder: number) => {
  // Shift all brands with sortOrder > deletedOrder down by 1 to fill the gap
  await Brand.updateMany(
    { sortOrder: { $gt: deletedOrder }, isDeleted: false },
    { $inc: { sortOrder: -1 } }
  );
};

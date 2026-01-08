import { Cms, type ICms } from '../models/Cms.js';

/**
 * CMS Service
 * Database operations for Cms model
 */

export const findPages = async (query: any = {}, options: any = {}) => {
    const { page = 1, limit = 25, sort = { sortOrder: 1 } } = options;
    const skip = (page - 1) * limit;

    return {
        pages: await Cms.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        total: await Cms.countDocuments(query)
    };
};

export const countPages = async (query: any = {}) => {
    return await Cms.countDocuments(query);
};

export const findPageById = async (id: string) => {
    return await Cms.findById(id);
};

export const findPageByType = async (type: string) => {
    return await Cms.findOne({ type, isDeleted: false });
};

export const updatePageById = async (id: string, data: Partial<ICms>) => {
    return await Cms.findByIdAndUpdate(id, data, { new: true });
};

export const createPage = async (data: Partial<ICms>) => {
    return await Cms.create(data);
};

export const deletePageById = async (id: string) => {
    return await Cms.findByIdAndUpdate(id, { isDeleted: true });
};

export const pageExists = async (type: string) => {
    return await Cms.exists({ type, isDeleted: false });
};

export const bulkUpdate = async (ids: string[], updateData: Partial<ICms>) => {
    return await Cms.updateMany(
        { _id: { $in: ids }, isDeleted: false },
        { $set: updateData }
    );
};

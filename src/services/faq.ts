import { Faq, type IFaq } from '../models/Faq.js';

/**
 * FAQ Service
 * Database operations for Faq model
 */

export const createFaq = async (data: Partial<IFaq>) => {
    return await Faq.create(data);
};

export const findFaqById = async (id: string) => {
    return await Faq.findById(id);
};

export const updateFaqById = async (id: string, data: Partial<IFaq>) => {
    return await Faq.findByIdAndUpdate(id, data, { new: true });
};

export const deleteFaqById = async (id: string) => {
    return await Faq.findByIdAndDelete(id);
};

export const findFaqs = async (query: any = {}, options: any = {}) => {
    const { page = 1, limit = 25, sort = { sortOrder: 1 } } = options;
    const skip = (page - 1) * limit;

    return {
        faqs: await Faq.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        total: await Faq.countDocuments(query)
    };
};

export const countFaqs = async (query: any = {}) => {
    return await Faq.countDocuments(query);
};

export const bulkUpdate = async (ids: string[], updateData: Partial<IFaq>) => {
    return await Faq.updateMany(
        { _id: { $in: ids }, isDeleted: false },
        { $set: updateData }
    );
};

// Sorting & Ordering
export const getNextSortOrder = async () => {
    const last = await Faq.findOne({ isDeleted: false }).sort({ sortOrder: -1 });
    return (last?.sortOrder || 0) + 1;
};

export const reorderOnUpdate = async (id: string, newOrder: number, oldOrder: number) => {
    if (newOrder === oldOrder) return;

    if (newOrder < oldOrder) {
        await Faq.updateMany(
            {
                _id: { $ne: id },
                sortOrder: { $gte: newOrder, $lt: oldOrder },
                isDeleted: false
            },
            { $inc: { sortOrder: 1 } }
        );
    } else {
        await Faq.updateMany(
            {
                _id: { $ne: id },
                sortOrder: { $gt: oldOrder, $lte: newOrder },
                isDeleted: false
            },
            { $inc: { sortOrder: -1 } }
        );
    }
};

export const shiftOrdersForInsert = async (targetOrder: number) => {
    await Faq.updateMany(
        { sortOrder: { $gte: targetOrder }, isDeleted: false },
        { $inc: { sortOrder: 1 } }
    );
};

export const reorderOnDelete = async (deletedOrder: number) => {
    await Faq.updateMany(
        { sortOrder: { $gt: deletedOrder }, isDeleted: false },
        { $inc: { sortOrder: -1 } }
    );
};

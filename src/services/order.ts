import { Order, type IOrder } from '../models/Order.js';
import { Types } from 'mongoose';

/**
 * Order CRUD Service
 * Simple database operations for Order model
 */

export const createOrder = async (orderData: Partial<IOrder>) => {
  return await Order.create(orderData);
};

export const findOrderById = async (id: string) => {
  return await Order.findById(id)
    .populate('customer', 'firstName lastName email phone')
    .populate('items.product', 'name slug sku price images');
};

export const findOrderByNumber = async (orderNumber: string) => {
  return await Order.findOne({ orderNumber })
    .populate('customer', 'firstName lastName email phone')
    .populate('items.product', 'name slug sku price images');
};

export const updateOrderById = async (id: string, updateData: Partial<IOrder>) => {
  return await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const deleteOrderById = async (id: string) => {
  return await Order.findByIdAndDelete(id);
};

export const findOrders = async (query: any = {}, options: any = {}) => {
  const { page = 1, limit = 25, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;
  
  return {
    orders: await Order.find(query)
      .populate('customer', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    total: await Order.countDocuments(query)
  };
};

export const findOrdersByCustomer = async (customerId: string, options: any = {}) => {
  return await findOrders({ customer: customerId }, options);
};

export const findRecentOrders = async (limit: number = 10) => {
  return await Order.find()
    .populate('customer', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const countOrders = async (query: any = {}) => {
  return await Order.countDocuments(query);
};

export const orderExists = async (query: any) => {
  return await Order.exists(query);
};

// Analytics helpers
export const getOrderStats = async (dateRange?: { start: Date; end: Date }) => {
  const matchStage: any = {};
  if (dateRange) {
    matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  return await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

export const getOrdersByStatus = async (dateRange?: { start: Date; end: Date }) => {
  const matchStage: any = {};
  if (dateRange) {
    matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  return await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    }
  ]);
};

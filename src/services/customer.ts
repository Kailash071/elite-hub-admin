import { Customer, type ICustomer } from '../models/Customer.js';

/**
 * Customer CRUD Service
 * Simple database operations for Customer model
 */

export const createCustomer = async (customerData: Partial<ICustomer>) => {
  return await Customer.create(customerData);
};

export const findCustomerById = async (id: string) => {
  return await Customer.findById(id).select('-password -passwordResetToken -passwordResetExpires');
};

export const findCustomerByEmail = async (email: string) => {
  return await Customer.findOne({ email: email.toLowerCase() }).select('-password');
};

export const updateCustomerById = async (id: string, updateData: Partial<ICustomer>) => {
  return await Customer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    .select('-password -passwordResetToken -passwordResetExpires');
};

export const deleteCustomerById = async (id: string) => {
  return await Customer.findByIdAndDelete(id);
};

export const findCustomers = async (query: any = {}, options: any = {}) => {
  const { page = 1, limit = 25, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;
  
  return {
    customers: await Customer.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    total: await Customer.countDocuments(query)
  };
};

export const countCustomers = async (query: any = {}) => {
  return await Customer.countDocuments(query);
};

export const customerExists = async (query: any) => {
  return await Customer.exists(query);
};

import { Admin, type IAdmin } from '../models/Admin.js';
import { Types } from 'mongoose';

/**
 * Admin CRUD Service
 * Simple database operations for Admin model
 */

export const createAdmin = async (adminData: Partial<IAdmin>) => {
  return await Admin.create(adminData);
};

export const findAdminById = async (id: string) => {
  return await Admin.findById(id).populate('roles', 'name description permissions');
};

export const findAdminByEmail = async (email: string) => {
  return await Admin.findOne({ email: email.toLowerCase() });
};

export const findAdminByUsername = async (username: string) => {
  return await Admin.findOne({ username: username.toLowerCase() });
};

export const findAdminByEmailOrUsername = async (identifier: string) => {
  return await Admin.findByEmailOrUsername(identifier);
};

export const updateAdminById = async (id: string, updateData: Partial<IAdmin>) => {
  return await Admin.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

export const deleteAdminById = async (id: string) => {
  return await Admin.findByIdAndDelete(id);
};

export const findAdmins = async (query: any = {}, options: any = {}) => {
  const { page = 1, limit = 25, sort = { createdAt: -1 }, populate = 'roles' } = options;
  const skip = (page - 1) * limit;
  
  return {
    admins: await Admin.find(query)
      .populate(populate, 'name description')
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    total: await Admin.countDocuments(query)
  };
};

export const countAdmins = async (query: any = {}) => {
  return await Admin.countDocuments(query);
};

export const adminExists = async (query: any) => {
  return await Admin.exists(query);
};
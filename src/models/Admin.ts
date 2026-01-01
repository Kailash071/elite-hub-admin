import { Schema, model, Document, Types, Model } from 'mongoose';

// Static methods interface
export interface IAdminModel extends Model<IAdmin> {
  findByEmailOrUsername(identifier: string): Promise<IAdmin | null>;
}

export interface IAdmin extends Document {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  
  // Profile
  avatar?: string;
  phone?: string;
  
  // Role-Based Access Control
  roles: Types.ObjectId[]; // Multiple roles can be assigned
  
  // Account Security
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  // Account Status
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
  
  // Login Tracking
  lastLoginAt?: Date;
  lastLoginIP?: string;
  loginAttempts: number;
  lockUntil?: Date | undefined;
  
  // Password Management
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  passwordChangedAt?: Date;
  
  // Audit Trail
  createdBy?: Types.ObjectId; // Admin who created this account
  updatedBy?: Types.ObjectId; // Admin who last updated this account
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  fullName: string;
  isLocked: boolean;
  
  // Instance methods
  hasPermission(module: string, operation: string): Promise<boolean>;
  getAllPermissions(): Promise<Record<string, string[]>>;
  comparePassword(password: string): Promise<boolean>;
  generateResetToken(): string;
}

const adminSchema = new Schema<IAdmin>({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 255
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Profile
  avatar: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  // Role-Based Access Control
  roles: [{
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  }],
  
  // Account Security
  emailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false // Don't include in queries by default
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    trim: true
  },
  
  // Login Tracking
  lastLoginAt: Date,
  lastLoginIP: {
    type: String,
    trim: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Password Management
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  
  // Audit Trail
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ username: 1 }, { unique: true });
adminSchema.index({ roles: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ isBlocked: 1 });
adminSchema.index({ lastLoginAt: -1 });

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for checking if account is locked
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Instance method to check if admin has specific permission
adminSchema.methods.hasPermission = async function(module: string, operation: string): Promise<boolean> {
  if (!this.populated('roles')) {
    await this.populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
  }
  
  for (const role of this.roles) {
    if (!role.permissions) continue;
    
    for (const permission of role.permissions) {
      if (permission.module === module && permission.operations.includes(operation)) {
        return true;
      }
    }
  }
  return false;
};

// Instance method to get all permissions
adminSchema.methods.getAllPermissions = async function(): Promise<Record<string, string[]>> {
  if (!this.populated('roles')) {
    await this.populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
  }
  
  const permissions = new Map<string, Set<string>>();
  
  for (const role of this.roles) {
    if (!role.permissions) continue;
    
    for (const permission of role.permissions) {
      const key = permission.module;
      if (!permissions.has(key)) {
        permissions.set(key, new Set<string>());
      }
      permission.operations.forEach((op: string) => permissions.get(key)!.add(op));
    }
  }
  
  // Convert to object
  const result: Record<string, string[]> = {};
  permissions.forEach((operations, module) => {
    result[module] = Array.from(operations);
  });
  
  return result;
};

// Instance method to compare passwords
adminSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, this.password);
};

// Instance method to generate password reset token
adminSchema.methods.generateResetToken = function(): string {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = resetToken;
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return resetToken;
};

// Static method to find by email or username
adminSchema.statics.findByEmailOrUsername = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

export const Admin = model<IAdmin, IAdminModel>('Admin', adminSchema);

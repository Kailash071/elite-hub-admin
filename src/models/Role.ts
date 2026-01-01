import { Schema, model, Document, Types } from 'mongoose';

export interface IRole extends Document {
  // Basic Information
  name: string; // e.g., "Super Admin", "Manager", "Editor", "Viewer"
  slug: string; // e.g., "super-admin", "manager", "editor", "viewer"
  description?: string;
  
  // Permissions
  permissions: Types.ObjectId[]; // Array of permission IDs
  
  // Role Configuration
  isSystemRole: boolean; // Cannot be deleted (built-in roles)
  isActive: boolean;
  
  // Role Hierarchy
  level: number; // Higher number = more privileges (Super Admin = 100, Manager = 80, etc.)
  
  // Audit Trail
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  hasPermission(module: string, operation: string): Promise<boolean>;
  getAccessibleModules(): Promise<string[]>;
}

const roleSchema = new Schema<IRole>({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Permissions
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  
  // Role Configuration
  isSystemRole: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Role Hierarchy
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 10
  },
  
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
roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ slug: 1 }, { unique: true });
roleSchema.index({ isActive: 1 });
roleSchema.index({ level: -1 });
roleSchema.index({ isSystemRole: 1 });

// Virtual for admins count
roleSchema.virtual('adminsCount', {
  ref: 'Admin',
  localField: '_id',
  foreignField: 'roles',
  count: true
});

// Instance method to check if role has specific permission
roleSchema.methods.hasPermission = async function(module: string, operation: string) {
  await this.populate('permissions');
  
  for (const permission of this.permissions) {
    if (permission.module === module && permission.operations.includes(operation)) {
      return true;
    }
  }
  return false;
};

// Instance method to get all modules accessible by this role
roleSchema.methods.getAccessibleModules = async function(): Promise<string[]> {
  if (!this.populated('permissions')) {
    await this.populate('permissions');
  }
  
  const modules = new Set<string>();
  this.permissions.forEach((permission: any) => {
    modules.add(permission.module);
  });
  
  return Array.from(modules);
};

// Static method to find roles by level
roleSchema.statics.findByMinLevel = function(minLevel: number) {
  return this.find({ level: { $gte: minLevel }, isActive: true });
};

// Pre-remove middleware to prevent deletion of system roles
roleSchema.pre('deleteOne', { document: true }, function(next) {
  if (this.isSystemRole) {
    const error = new Error('Cannot delete system role');
    return next(error);
  }
  next();
});

roleSchema.pre('findOneAndDelete', function(next) {
  this.where({ isSystemRole: { $ne: true } });
  next();
});

export const Role = model<IRole>('Role', roleSchema);

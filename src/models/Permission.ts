import { Schema, model, Document, Types } from 'mongoose';

export type OperationType = 'view' | 'add' | 'edit' | 'delete' | 'export' | 'import';

export interface IPermission extends Document {
  // Permission Identification
  name: string; // e.g., "Products Management", "Orders View Only"
  slug: string; // e.g., "products-management", "orders-view-only"
  description?: string;
  
  // Module & Operations
  module: string; // e.g., "products", "orders", "customers", "settings"
  operations: OperationType[]; // e.g., ["view", "add", "edit", "delete"]
  
  // Permission Metadata
  category?: string; // e.g., "E-commerce", "Content", "System", "Reports"
  icon?: string; // Icon for UI display
  
  // Permission Configuration
  isSystemPermission: boolean; // Cannot be deleted (built-in permissions)
  isActive: boolean;
  
  // Audit Trail
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>({
  // Permission Identification
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  },
  
  // Module & Operations
  module: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    enum: [
      'dashboard',
      'products',
      'categories', 
      'brands',
      'customers',
      'orders',
      'reviews',
      'coupons',
      'banners',
      'wishlist',
      'cart',
      'settings',
      'admins',
      'roles',
      'permissions',
      'reports',
      'analytics',
      'media',
      'notifications'
    ]
  },
  operations: [{
    type: String,
    required: true,
    enum: ['view', 'add', 'edit', 'delete', 'export', 'import']
  }],
  
  // Permission Metadata
  category: {
    type: String,
    trim: true,
    enum: ['E-commerce', 'Content', 'System', 'Reports', 'User Management'],
    default: 'E-commerce'
  },
  icon: {
    type: String,
    trim: true
  },
  
  // Permission Configuration
  isSystemPermission: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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
permissionSchema.index({ slug: 1 }, { unique: true });
permissionSchema.index({ module: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ isActive: 1 });
permissionSchema.index({ isSystemPermission: 1 });

// Compound index for module and operations
permissionSchema.index({ module: 1, operations: 1 });

// Virtual for checking if permission includes specific operation
permissionSchema.virtual('hasViewAccess').get(function() {
  return this.operations.includes('view');
});

permissionSchema.virtual('hasFullAccess').get(function() {
  const fullOperations: OperationType[] = ['view', 'add', 'edit', 'delete'];
  return fullOperations.every(op => this.operations.includes(op));
});

// Static method to find permissions by module
permissionSchema.statics.findByModule = function(module: string) {
  return this.find({ module, isActive: true });
};

// Static method to find permissions by category
permissionSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true });
};

// Static method to group permissions by module
permissionSchema.statics.getPermissionsByModule = async function() {
  const permissions = await this.find({ isActive: true }).lean();
  
  const groupedPermissions: any = {};
  permissions.forEach((permission: any) => {
    if (!groupedPermissions[permission.module]) {
      groupedPermissions[permission.module] = [];
    }
    groupedPermissions[permission.module].push(permission);
  });
  
  return groupedPermissions;
};

// Pre-remove middleware to prevent deletion of system permissions
permissionSchema.pre('deleteOne', { document: true }, function(next) {
  if (this.isSystemPermission) {
    const error = new Error('Cannot delete system permission');
    return next(error);
  }
  next();
});

permissionSchema.pre('findOneAndDelete', function(next) {
  this.where({ isSystemPermission: { $ne: true } });
  next();
});

export const Permission = model<IPermission>('Permission', permissionSchema);

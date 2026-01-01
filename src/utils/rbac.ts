/**
 * RBAC Utility Functions
 * Helper functions for role-based access control
 */

import { Admin, Role, Permission } from '../models/index.js';
import { type Types } from 'mongoose';

/**
 * Check if admin has specific permission
 */
export async function checkPermission(
  adminId: string | Types.ObjectId, 
  module: string, 
  operation: string
): Promise<boolean> {
  try {
    const admin = await Admin.findById(adminId).populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
    
    if (!admin || !admin.isActive) return false;
    
    return admin.hasPermission(module, operation);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Get all accessible modules for an admin
 */
export async function getAccessibleModules(adminId: string | Types.ObjectId): Promise<string[]> {
  try {
    const admin = await Admin.findById(adminId).populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
    
    if (!admin || !admin.isActive) return [];
    
    const modules = new Set<string>();
    
    for (const roleId of admin.roles) {
      const roleDoc = await Role.findById(roleId).populate('permissions');
      if (roleDoc) {
        const roleModules = await roleDoc.getAccessibleModules();
        roleModules.forEach((module: string) => modules.add(module));
      }
    }
    
    return Array.from(modules);
  } catch (error) {
    console.error('Error getting accessible modules:', error);
    return [];
  }
}

/**
 * Get admin's complete permission matrix
 */
export async function getPermissionMatrix(adminId: string | Types.ObjectId) {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive) return {};
    
    return admin.getAllPermissions();
  } catch (error) {
    console.error('Error getting permission matrix:', error);
    return {};
  }
}

/**
 * Create navigation menu based on admin's permissions
 */
export async function generateNavigationMenu(adminId: string | Types.ObjectId) {
  try {
    const permissions = await getPermissionMatrix(adminId);
    
    const navigation = {
      dashboard: { 
        label: 'Dashboard', 
        icon: 'dashboard', 
        path: '/dashboard',
        visible: permissions.dashboard?.includes('view') || false
      },
      
      // E-commerce Section
      ecommerce: {
        label: 'E-commerce',
        icon: 'store',
        children: {
          products: {
            label: 'Products',
            icon: 'inventory',
            path: '/products',
            visible: permissions.products?.includes('view') || false,
            permissions: permissions.products || []
          },
          categories: {
            label: 'Categories',
            icon: 'category',
            path: '/categories',
            visible: permissions.categories?.includes('view') || false,
            permissions: permissions.categories || []
          },
          brands: {
            label: 'Brands',
            icon: 'brand',
            path: '/brands',
            visible: permissions.brands?.includes('view') || false,
            permissions: permissions.brands || []
          },
          orders: {
            label: 'Orders',
            icon: 'receipt',
            path: '/orders',
            visible: permissions.orders?.includes('view') || false,
            permissions: permissions.orders || []
          },
          customers: {
            label: 'Customers',
            icon: 'people',
            path: '/customers',
            visible: permissions.customers?.includes('view') || false,
            permissions: permissions.customers || []
          },
          coupons: {
            label: 'Coupons',
            icon: 'discount',
            path: '/coupons',
            visible: permissions.coupons?.includes('view') || false,
            permissions: permissions.coupons || []
          }
        }
      },
      
      // Content Section
      content: {
        label: 'Content',
        icon: 'edit',
        children: {
          banners: {
            label: 'Banners',
            icon: 'image',
            path: '/banners',
            visible: permissions.banners?.includes('view') || false,
            permissions: permissions.banners || []
          },
          reviews: {
            label: 'Reviews',
            icon: 'star',
            path: '/reviews',
            visible: permissions.reviews?.includes('view') || false,
            permissions: permissions.reviews || []
          }
        }
      },
      
      // Reports Section
      reports: {
        label: 'Reports',
        icon: 'assessment',
        children: {
          analytics: {
            label: 'Analytics',
            icon: 'analytics',
            path: '/analytics',
            visible: permissions.analytics?.includes('view') || false,
            permissions: permissions.analytics || []
          },
          reports: {
            label: 'Reports',
            icon: 'report',
            path: '/reports',
            visible: permissions.reports?.includes('view') || false,
            permissions: permissions.reports || []
          }
        }
      },
      
      // System Section
      system: {
        label: 'System',
        icon: 'settings',
        children: {
          settings: {
            label: 'Settings',
            icon: 'settings',
            path: '/settings',
            visible: permissions.settings?.includes('view') || false,
            permissions: permissions.settings || []
          },
          admins: {
            label: 'Admin Users',
            icon: 'admin_panel_settings',
            path: '/admins',
            visible: permissions.admins?.includes('view') || false,
            permissions: permissions.admins || []
          },
          roles: {
            label: 'Roles',
            icon: 'group',
            path: '/roles',
            visible: permissions.roles?.includes('view') || false,
            permissions: permissions.roles || []
          },
          permissions: {
            label: 'Permissions',
            icon: 'security',
            path: '/permissions',
            visible: permissions.permissions?.includes('view') || false,
            permissions: permissions.permissions || []
          }
        }
      }
    };
    
    // Filter out sections with no visible children
    Object.keys(navigation).forEach(sectionKey => {
      const section = navigation[sectionKey as keyof typeof navigation] as any;
      if (section.children) {
        const visibleChildren = Object.keys(section.children).filter(
          childKey => section.children[childKey].visible
        );
        if (visibleChildren.length === 0) {
          section.visible = false;
        } else {
          section.visible = true;
        }
      }
    });
    
    return navigation;
  } catch (error) {
    console.error('Error generating navigation menu:', error);
    return {};
  }
}

/**
 * Get available operations for a specific module based on admin's permissions
 */
export async function getModuleOperations(
  adminId: string | Types.ObjectId, 
  module: string
): Promise<string[]> {
  try {
    const permissions = await getPermissionMatrix(adminId);
    return permissions[module] || [];
  } catch (error) {
    console.error('Error getting module operations:', error);
    return [];
  }
}

/**
 * Check if admin can perform bulk operations
 */
export async function canPerformBulkOperation(
  adminId: string | Types.ObjectId, 
  module: string, 
  operations: string[]
): Promise<boolean> {
  try {
    const adminOperations = await getModuleOperations(adminId, module);
    return operations.every(op => adminOperations.includes(op));
  } catch (error) {
    console.error('Error checking bulk operations:', error);
    return false;
  }
}

/**
 * Get permission summary for UI display
 */
export async function getPermissionSummary(adminId: string | Types.ObjectId) {
  try {
    const admin = await Admin.findById(adminId).populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
    
    if (!admin) return null;
    
    const permissions = await admin.getAllPermissions();
    const accessibleModules = await getAccessibleModules(adminId);
    
    return {
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        roles: admin.roles.map((role: any) => ({
          id: role._id,
          name: role.name,
          level: role.level
        }))
      },
      permissions,
      accessibleModules,
      totalModules: accessibleModules.length,
      isSuper: admin.roles.some((role: any) => role.slug === 'super-admin')
    };
  } catch (error) {
    console.error('Error getting permission summary:', error);
    return null;
  }
}

/**
 * Module definitions for UI and validation
 */
export const MODULE_DEFINITIONS = {
  dashboard: {
    label: 'Dashboard',
    description: 'System overview and analytics',
    icon: 'dashboard'
  },
  products: {
    label: 'Products',
    description: 'Product catalog management',
    icon: 'inventory'
  },
  categories: {
    label: 'Categories',
    description: 'Product category management',
    icon: 'category'
  },
  brands: {
    label: 'Brands',
    description: 'Product brand management',
    icon: 'brand'
  },
  customers: {
    label: 'Customers',
    description: 'Customer account management',
    icon: 'people'
  },
  orders: {
    label: 'Orders',
    description: 'Order processing and fulfillment',
    icon: 'receipt'
  },
  reviews: {
    label: 'Reviews',
    description: 'Product review moderation',
    icon: 'star'
  },
  coupons: {
    label: 'Coupons',
    description: 'Discount and coupon management',
    icon: 'discount'
  },
  banners: {
    label: 'Banners',
    description: 'Promotional banner management',
    icon: 'image'
  },
  settings: {
    label: 'Settings',
    description: 'System configuration',
    icon: 'settings'
  },
  admins: {
    label: 'Admin Users',
    description: 'Administrative user management',
    icon: 'admin_panel_settings'
  },
  roles: {
    label: 'Roles',
    description: 'Role management',
    icon: 'group'
  },
  permissions: {
    label: 'Permissions',
    description: 'Permission management',
    icon: 'security'
  },
  reports: {
    label: 'Reports',
    description: 'Business reports and insights',
    icon: 'assessment'
  },
  analytics: {
    label: 'Analytics',
    description: 'Detailed analytics and metrics',
    icon: 'analytics'
  }
};

/**
 * Operation definitions
 */
export const OPERATION_DEFINITIONS = {
  view: {
    label: 'View',
    description: 'Read and view data',
    icon: 'visibility',
    color: 'blue'
  },
  add: {
    label: 'Add',
    description: 'Create new records',
    icon: 'add',
    color: 'green'
  },
  edit: {
    label: 'Edit',
    description: 'Modify existing records',
    icon: 'edit',
    color: 'orange'
  },
  delete: {
    label: 'Delete',
    description: 'Remove records',
    icon: 'delete',
    color: 'red'
  },
  export: {
    label: 'Export',
    description: 'Export data to files',
    icon: 'download',
    color: 'purple'
  },
  import: {
    label: 'Import',
    description: 'Import data from files',
    icon: 'upload',
    color: 'teal'
  }
};

// Re-export functions from default.ts for convenience
export {
  initializeDefaultData,
  validateRBACIntegrity,
  needsInitialization,
  getPermissionStats,
  getRoleStats,
  createAdminUser
} from '../constant/default.js';

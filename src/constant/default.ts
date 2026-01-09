import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { Role } from '../models/Role.js';
import { Permission } from '../models/Permission.js';
import { Setting } from '../models/Setting.js';
import defaultData from './models.json' assert { type: 'json' };
import { mainCategories } from './static.js';
import * as CategoryService from '../services/category';
/**
 * Force initialize default data in the database
 * This will overwrite existing data
 */
export async function forceInitializeDefaultData(): Promise<void> {
  try {
    console.log('🚨 Force initializing default data (this will overwrite existing data)...');

    await initializePermissions(true);
    await initializeRoles(true);
    await initializeAdmins(true);
    await initializeSettings();

    console.log('✅ Force initialization completed successfully');
  } catch (error) {
    console.error('❌ Failed to force initialize default data:', error);
    throw error;
  }
}

/**
 * Initialize default data in the database
 * Only initializes if collections are empty
 */
export async function initializeDefaultData(): Promise<void> {
  try {
    console.log('🚀 Checking if default data initialization is needed...');

    // Check if collections are empty
    const [permissionsCount, rolesCount, adminsCount] = await Promise.all([
      Permission.countDocuments(),
      Role.countDocuments(),
      Admin.countDocuments()
    ]);

    if (permissionsCount === 0) {
      console.log('📋 Permissions collection is empty, initializing...');
      await initializePermissions();
    } else {
      console.log(`ℹ️  Found ${permissionsCount} existing permissions, skipping permissions initialization`);
    }

    if (rolesCount === 0) {
      console.log('👥 Roles collection is empty, initializing...');
      await initializeRoles();
    } else {
      console.log(`ℹ️  Found ${rolesCount} existing roles, skipping roles initialization`);
    }

    if (adminsCount === 0) {
      console.log('👤 Admins collection is empty, initializing...');
      await initializeAdmins();
    } else {
      console.log(`ℹ️  Found ${adminsCount} existing admins, skipping admins initialization`);
    }

    // Always check settings (they can be added to incrementally)
    await initializeSettings();

    console.log('✅ Default data initialization completed successfully');
  } catch (error) {
    console.error('❌ Failed to initialize default data:', error);
    throw error;
  }
}

/**
 * Initialize default permissions
 */
export async function initializePermissions(force: boolean = false): Promise<void> {
  console.log('📋 Initializing permissions...');

  if (!force) {
    const existingCount = await Permission.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing permissions, skipping...`);
      return;
    }
  }

  for (const permissionData of defaultData.permissions) {
    try {
      await Permission.findOneAndUpdate(
        { slug: permissionData.slug },
        {
          ...permissionData,
          isActive: true
        },
        {
          upsert: true,
          setDefaultsOnInsert: true
        }
      );
    } catch (error) {
      console.error(`❌ Error creating permission ${permissionData.slug}:`, error);
    }
  }

  const totalPermissions = await Permission.countDocuments();
  console.log(`✅ Initialized ${totalPermissions} permissions`);
}

/**
 * Initialize default roles with their permissions
 */
export async function initializeRoles(force: boolean = false): Promise<void> {
  console.log('👥 Initializing roles...');

  if (!force) {
    const existingCount = await Role.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing roles, skipping...`);
      return;
    }
  }

  for (const roleData of defaultData.roles) {
    try {
      // Find permissions by their slugs
      const permissions = await Permission.find({
        slug: { $in: roleData.permissionSlugs },
        isActive: true
      });

      const permissionIds = permissions.map(p => p._id);

      await Role.findOneAndUpdate(
        { slug: roleData.slug },
        {
          name: roleData.name,
          slug: roleData.slug,
          description: roleData.description,
          level: roleData.level,
          isSystemRole: roleData.isSystemRole,
          permissions: permissionIds,
          isActive: true
        },
        {
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      console.log(`✅ Role "${roleData.name}" initialized with ${permissionIds.length} permissions`);
    } catch (error) {
      console.error(`❌ Error creating role ${roleData.slug}:`, error);
    }
  }

  const totalRoles = await Role.countDocuments();
  console.log(`✅ Initialized ${totalRoles} roles`);
}

/**
 * Initialize default admin users
 */
export async function initializeAdmins(force: boolean = false): Promise<void> {
  console.log('👤 Initializing admin users...');

  if (!force) {
    const existingCount = await Admin.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing admins, skipping...`);
      return;
    }
  }

  for (const adminData of defaultData.admins) {
    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [
          { email: adminData.email },
          { username: adminData.username }
        ]
      });

      if (existingAdmin) {
        console.log(`⏭️  Admin "${adminData.username}" already exists, skipping...`);
        continue;
      }

      // Find roles by their slugs
      const roles = await Role.find({
        slug: { $in: adminData.roleSlugs },
        isActive: true
      });

      const roleIds = roles.map(r => r._id);

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      const admin = new Admin({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        username: adminData.username,
        password: hashedPassword,
        roles: roleIds,
        emailVerified: adminData.emailVerified,
        isActive: adminData.isActive,
        passwordChangedAt: new Date()
      });

      await admin.save();
      console.log(`✅ Admin "${adminData.username}" created with roles: ${adminData.roleSlugs.join(', ')}`);
    } catch (error) {
      console.error(`❌ Error creating admin ${adminData.username}:`, error);
    }
  }

  const totalAdmins = await Admin.countDocuments();
  console.log(`✅ Initialized ${totalAdmins} admin users`);
}

/**
 * Initialize default system settings
 */
export async function initializeSettings(): Promise<void> {
  try {
    let count = await Setting.countDocuments();
    if (count === 0) {
      const settingsData = defaultData.settings || {};
      const setting = await Setting.create(settingsData);
      console.log('✅ Created default system settings:', setting);
    } else {
      console.log('ℹ️  System settings already exist, skipping initialization');
    }
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
  }
}


/**
 * Get permission statistics
 */
export async function getPermissionStats() {
  const stats = await Permission.aggregate([
    {
      $group: {
        _id: '$module',
        count: { $sum: 1 },
        operations: { $push: '$operations' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return stats;
}

/**
 * Get role statistics  
 */
export async function getRoleStats() {
  const stats = await Role.aggregate([
    {
      $lookup: {
        from: 'admins',
        localField: '_id',
        foreignField: 'roles',
        as: 'admins'
      }
    },
    {
      $project: {
        name: 1,
        level: 1,
        permissionsCount: { $size: '$permissions' },
        adminsCount: { $size: '$admins' }
      }
    },
    {
      $sort: { level: -1 }
    }
  ]);

  return stats;
}

/**
 * Validate RBAC system integrity
 */
export async function validateRBACIntegrity(): Promise<boolean> {
  try {
    console.log('🔍 Validating RBAC system integrity...');

    // Check if all required collections exist and have data
    const permissionsCount = await Permission.countDocuments();
    const rolesCount = await Role.countDocuments();
    const adminsCount = await Admin.countDocuments();

    if (permissionsCount === 0) {
      console.error('❌ No permissions found in database');
      return false;
    }

    if (rolesCount === 0) {
      console.error('❌ No roles found in database');
      return false;
    }

    if (adminsCount === 0) {
      console.error('❌ No admin users found in database');
      return false;
    }

    // Check if all roles have valid permissions
    const rolesWithPermissions = await Role.find({ isActive: true }).populate('permissions');
    for (const role of rolesWithPermissions) {
      if (role.permissions.length === 0) {
        console.warn(`⚠️  Role "${role.name}" has no permissions assigned`);
      }
    }

    // Check if all admins have valid roles
    const adminsWithRoles = await Admin.find({ isActive: true }).populate('roles');
    for (const admin of adminsWithRoles) {
      if (admin.roles.length === 0) {
        console.warn(`⚠️  Admin "${admin.username}" has no roles assigned`);
      }
    }

    console.log('✅ RBAC system integrity validated successfully');
    console.log(`📊 Stats: ${permissionsCount} permissions, ${rolesCount} roles, ${adminsCount} admins`);

    return true;
  } catch (error) {
    console.error('❌ RBAC validation failed:', error);
    return false;
  }
}

/**
 * Check if system needs initialization
 */
export async function needsInitialization(): Promise<boolean> {
  try {
    const [permissionsCount, rolesCount, adminsCount] = await Promise.all([
      Permission.countDocuments(),
      Role.countDocuments(),
      Admin.countDocuments()
    ]);

    return permissionsCount === 0 || rolesCount === 0 || adminsCount === 0;
  } catch (error) {
    console.error('❌ Error checking initialization status:', error);
    return true; // Assume needs initialization on error
  }
}

/**
 * Reset all RBAC data (DANGER: This will delete all admins, roles, and permissions)
 */
export async function resetRBACData(): Promise<void> {
  console.log('🚨 DANGER: Resetting all RBAC data...');

  await Promise.all([
    Admin.deleteMany({}),
    Role.deleteMany({}),
    Permission.deleteMany({})
  ]);

  console.log('✅ RBAC data reset completed');

  // Re-initialize with defaults
  await initializeDefaultData();
}

/**
 * Create a new admin user with specified roles
 */
export async function createAdminUser(adminData: {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roleSlugs: string[];
  createdBy?: string;
}): Promise<any> {
  // Find roles by slugs
  const roles = await Role.find({
    slug: { $in: adminData.roleSlugs },
    isActive: true
  });

  if (roles.length !== adminData.roleSlugs.length) {
    throw new Error('One or more specified roles not found');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminData.password, 12);

  const admin = new Admin({
    firstName: adminData.firstName,
    lastName: adminData.lastName,
    email: adminData.email,
    username: adminData.username,
    password: hashedPassword,
    roles: roles.map(r => r._id),
    emailVerified: true,
    isActive: true,
    createdBy: adminData.createdBy,
    passwordChangedAt: new Date()
  });

  return admin.save();
}

export const createDefaultMainCategories = async () => {
  for (const mainCategory of mainCategories) {
    let isExists = await CategoryService.findMainCategoryBySlug(mainCategory.slug);
    if (!isExists) {
      await CategoryService.createMainCategory(mainCategory);
    }
  }
}
export const updateDefaultMainCategories = async () => {
  for (const mainCategory of mainCategories) {
    let isExists = await CategoryService.findMainCategoryBySlug(mainCategory.slug);
    if (isExists) {
      await CategoryService.updateMainCategoryByQuery({ _id: isExists?._id }, mainCategory);
    }
  }
}
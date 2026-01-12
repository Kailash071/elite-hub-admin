import { Schema, model, Document } from 'mongoose';

export interface ICustomerAddress {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export interface ICustomer extends Document {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  isDeleted: boolean;
  // Account Security
  password: string;
  emailVerified: boolean;
  phoneVerified: boolean;

  // Account Status
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;

  // Addresses
  addresses: ICustomerAddress[];

  // Preferences
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    language: string;
    currency: string;
  };

  // Customer Metrics
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;

  // Account Management
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  // Loyalty Program
  loyaltyPoints: number;
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Notes (Admin use)
  adminNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const customerAddressSchema = new Schema<ICustomerAddress>({
  type: {
    type: String,
    enum: ['shipping', 'billing'],
    required: true
  },
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
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: 100
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    default: 'India'
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const customerSchema = new Schema<ICustomer>({
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
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },

  // Account Security
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
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
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Addresses
  addresses: [customerAddressSchema],

  // Preferences
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en',
      maxlength: 10
    },
    currency: {
      type: String,
      default: 'INR',
      maxlength: 10
    }
  },

  // Customer Metrics
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },

  // Account Management
  lastLoginAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // Loyalty Program
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  membershipTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },

  // Admin Notes
  adminNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ phone: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ isBlocked: 1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ totalOrders: -1 });
customerSchema.index({ loyaltyPoints: -1 });
customerSchema.index({ membershipTier: 1 });
customerSchema.index({ lastLoginAt: -1 });
customerSchema.index({ createdAt: -1 });

// Text index for search
customerSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  phone: 'text'
});

// Virtual for full name
customerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for default shipping address
customerSchema.virtual('defaultShippingAddress').get(function () {
  return this.addresses.find(addr => addr.type === 'shipping' && addr.isDefault);
});

// Virtual for default billing address
customerSchema.virtual('defaultBillingAddress').get(function () {
  return this.addresses.find(addr => addr.type === 'billing' && addr.isDefault);
});

export const Customer = model<ICustomer>('Customer', customerSchema);

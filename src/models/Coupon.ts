import { Schema, model, Document, Types } from 'mongoose';

export interface ICoupon extends Document {
  // Basic Info
  code: string; // Coupon code (e.g., "SAVE20", "FIRSTORDER")
  name: string; // Display name for admin
  description?: string;
  
  // Discount Configuration
  discountType: 'percentage' | 'fixed' | 'freeShipping';
  discountValue: number; // Percentage (e.g., 20) or fixed amount (e.g., 500)
  
  // Usage Limits
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number; // Cap for percentage discounts
  usageLimit?: number; // Total times this coupon can be used
  usageLimitPerCustomer?: number; // Max uses per customer
  currentUsageCount: number;
  
  // Validity
  startDate: Date;
  endDate: Date;
  
  // Restrictions
  applicableProducts?: Types.ObjectId[]; // Specific products
  applicableCategories?: Types.ObjectId[]; // Specific categories
  excludedProducts?: Types.ObjectId[]; // Excluded products
  excludedCategories?: Types.ObjectId[]; // Excluded categories
  
  // Customer Restrictions
  applicableCustomers?: Types.ObjectId[]; // Specific customers (for personal coupons)
  firstOrderOnly: boolean; // Only for first-time customers
  
  // Status
  isActive: boolean;
  isPublic: boolean; // If false, coupon won't be displayed publicly
  
  // Admin Info
  createdBy?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  // Basic Info
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 50
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Discount Configuration
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'freeShipping']
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Usage Limits
  minimumOrderAmount: {
    type: Number,
    min: 0
  },
  maximumDiscountAmount: {
    type: Number,
    min: 0
  },
  usageLimit: {
    type: Number,
    min: 1
  },
  usageLimitPerCustomer: {
    type: Number,
    min: 1,
    default: 1
  },
  currentUsageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Validity
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Restrictions
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Customer Restrictions
  applicableCustomers: [{
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  firstOrderOnly: {
    type: Boolean,
    default: false
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Admin Info
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Customer' // Can be admin customer account
  }
}, {
  timestamps: true
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ isPublic: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ applicableCategories: 1 });
couponSchema.index({ applicableProducts: 1 });
couponSchema.index({ createdBy: 1 });
couponSchema.index({ currentUsageCount: 1 });

// Virtual for checking if coupon is currently valid
couponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate &&
         (!this.usageLimit || this.currentUsageCount < this.usageLimit);
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (!this.usageLimit) return null; // Unlimited
  return Math.max(0, this.usageLimit - this.currentUsageCount);
});

// Method to check if coupon is applicable to a specific order
couponSchema.methods.isApplicableToOrder = function(orderData: any) {
  // Check if currently valid
  if (!this.isCurrentlyValid) return false;
  
  // Check minimum order amount
  if (this.minimumOrderAmount && orderData.subtotal < this.minimumOrderAmount) {
    return false;
  }
  
  // Check customer-specific restrictions
  if (this.applicableCustomers?.length > 0) {
    if (!this.applicableCustomers.includes(orderData.customerId)) {
      return false;
    }
  }
  
  // Check first order only
  if (this.firstOrderOnly && orderData.customerOrderCount > 0) {
    return false;
  }
  
  // Check product/category restrictions
  if (this.applicableProducts?.length > 0 || this.applicableCategories?.length > 0) {
    const hasApplicableItems = orderData.items.some((item: any) => {
      // Check if product is specifically included
      if (this.applicableProducts?.length > 0) {
        return this.applicableProducts.includes(item.productId);
      }
      
      // Check if product's category is included
      if (this.applicableCategories?.length > 0) {
        return this.applicableCategories.some((catId: Types.ObjectId) => 
          item.productCategories?.includes(catId)
        );
      }
      
      return true;
    });
    
    if (!hasApplicableItems) return false;
  }
  
  // Check excluded products/categories
  if (this.excludedProducts?.length > 0) {
    const hasExcludedItems = orderData.items.some((item: any) => 
      this.excludedProducts?.includes(item.productId)
    );
    if (hasExcludedItems) return false;
  }
  
  if (this.excludedCategories?.length > 0) {
    const hasExcludedCategories = orderData.items.some((item: any) => 
      this.excludedCategories?.some((catId: Types.ObjectId) => 
        item.productCategories?.includes(catId)
      )
    );
    if (hasExcludedCategories) return false;
  }
  
  return true;
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderSubtotal: number) {
  if (!this.isCurrentlyValid) return 0;
  
  let discountAmount = 0;
  
  switch (this.discountType) {
    case 'percentage':
      discountAmount = (orderSubtotal * this.discountValue) / 100;
      // Apply maximum discount cap if set
      if (this.maximumDiscountAmount) {
        discountAmount = Math.min(discountAmount, this.maximumDiscountAmount);
      }
      break;
      
    case 'fixed':
      discountAmount = Math.min(this.discountValue, orderSubtotal);
      break;
      
    case 'freeShipping':
      discountAmount = 0; // Shipping discount handled separately
      break;
  }
  
  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

export const Coupon = model<ICoupon>('Coupon', couponSchema);

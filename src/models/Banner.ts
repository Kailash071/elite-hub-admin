import { Schema, model, Document, Types } from 'mongoose';

export interface IBanner extends Document {
  // Basic Info
  title: string;
  description?: string;
  
  // Images
  desktopImage: string; // URL for desktop version
  mobileImage?: string; // URL for mobile version (optional, falls back to desktop)
  altText?: string;
  
  // Link Configuration
  linkType: 'none' | 'category' | 'product' | 'url' | 'collection';
  linkTarget?: {
    category?: Types.ObjectId;
    product?: Types.ObjectId;
    url?: string;
    collection?: string;
  };
  linkText?: string; // Button text
  openInNewTab: boolean;
  
  // Placement
  placement: 'homepage-hero' | 'homepage-secondary' | 'category-page' | 'product-page' | 'checkout';
  position: number; // Sort order within placement
  
  // Targeting
  targetCategories?: Types.ObjectId[]; // Show only on specific category pages
  targetCustomerTypes?: ('new' | 'returning' | 'vip')[]; // Target specific customer types
  
  // Scheduling
  startDate?: Date;
  endDate?: Date;
  
  // Status
  isActive: boolean;
  
  // Analytics
  clickCount: number;
  impressionCount: number;
  
  // Admin Info
  createdBy?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>({
  // Basic Info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  },
  
  // Images
  desktopImage: {
    type: String,
    required: true,
    trim: true
  },
  mobileImage: {
    type: String,
    trim: true
  },
  altText: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Link Configuration
  linkType: {
    type: String,
    required: true,
    enum: ['none', 'category', 'product', 'url', 'collection'],
    default: 'none'
  },
  linkTarget: {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    url: {
      type: String,
      trim: true
    },
    collection: {
      type: String,
      trim: true
    }
  },
  linkText: {
    type: String,
    trim: true,
    maxlength: 50
  },
  openInNewTab: {
    type: Boolean,
    default: false
  },
  
  // Placement
  placement: {
    type: String,
    required: true,
    enum: ['homepage-hero', 'homepage-secondary', 'category-page', 'product-page', 'checkout']
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Targeting
  targetCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  targetCustomerTypes: [{
    type: String,
    enum: ['new', 'returning', 'vip']
  }],
  
  // Scheduling
  startDate: Date,
  endDate: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  clickCount: {
    type: Number,
    default: 0,
    min: 0
  },
  impressionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Admin Info
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  }
}, {
  timestamps: true
});

// Indexes
bannerSchema.index({ placement: 1, position: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ targetCategories: 1 });
bannerSchema.index({ createdBy: 1 });

// Virtual for checking if banner is currently active
bannerSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  // Check start date
  if (this.startDate && now < this.startDate) return false;
  
  // Check end date
  if (this.endDate && now > this.endDate) return false;
  
  return true;
});

// Virtual for click-through rate
bannerSchema.virtual('ctr').get(function() {
  if (this.impressionCount === 0) return 0;
  return (this.clickCount / this.impressionCount) * 100;
});

// Method to record click
bannerSchema.methods.recordClick = function() {
  this.clickCount += 1;
  return this.save();
};

// Method to record impression
bannerSchema.methods.recordImpression = function() {
  this.impressionCount += 1;
  return this.save();
};

export const Banner = model<IBanner>('Banner', bannerSchema);

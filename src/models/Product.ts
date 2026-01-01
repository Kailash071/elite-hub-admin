import { Schema, model, Document, Types } from 'mongoose';

export interface IProductImage {
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IProductVariant {
  sku: string;
  name: string;
  price: number;
  comparePrice?: number; // Original price for discount display
  costPrice?: number; // For profit calculation
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string; // cm, inch, etc.
  };
  attributes: Map<string, string>; // color: "red", size: "M", material: "gold"
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
  };
  isActive: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string; // Unique SKU
  description?: string;
  shortDescription?: string;
  productCode?: string; // Unique product identifier
  mainCategory: Types.ObjectId; // Main category
  subCategories: Types.ObjectId[]; // Multiple subcategories
  brand?: Types.ObjectId;
  
  // Product Media
  images: string[]; // Simplified to string array
  videos?: string[]; // URLs to product videos
  
  // Pricing (base product pricing, variants can override)
  price: number;
  salePrice?: number;
  costPrice?: number;
  
  // Product Variants
  variants: IProductVariant[];
  hasVariants: boolean;
  
  // Product Details
  tags: string[]; // For collections like "New Launch", "Wedding Season", etc.
  collections: string[]; // "Bridal Collection", "Antique Collection"
  materials: string[]; // "Gold Plated", "Kundan", "Stone"
  weight?: number; // in grams
  
  // Inventory (simplified)
  stockTracking: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  
  // Product Status
  isActive: boolean;
  isFeatured: boolean;
  isNewLaunch: boolean;
  isOnSale: boolean;
  
  // Ratings & Reviews
  averageRating: number;
  totalReviews: number;
  
  // Shipping
  shippingRequired: boolean;
  shippingWeight?: number;
  shippingDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  
  // Dates
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>({
  url: {
    type: String,
    required: true
  },
  altText: {
    type: String,
    maxlength: 200
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
});

const productVariantSchema = new Schema<IProductVariant>({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ['cm', 'inch', 'mm'], default: 'cm' }
  },
  attributes: {
    type: Map,
    of: String
  },
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    trackQuantity: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },
  productCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  mainCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand'
  },
  
  // Media
  images: [{
    type: String,
    trim: true
  }],
  videos: [{
    type: String,
    trim: true
  }],
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  
  // Variants
  variants: [productVariantSchema],
  hasVariants: {
    type: Boolean,
    default: false
  },
  
  // Product Details
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  collections: [{
    type: String,
    trim: true
  }],
  materials: [{
    type: String,
    trim: true
  }],
  weight: {
    type: Number,
    min: 0
  },
  
  // Simple inventory
  stockTracking: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  
  // SEO
  seoTitle: {
    type: String,
    maxlength: 60
  },
  seoDescription: {
    type: String,
    maxlength: 160
  },
  seoKeywords: [{
    type: String,
    trim: true
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewLaunch: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  
  // Ratings
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Shipping
  shippingRequired: {
    type: Boolean,
    default: true
  },
  shippingWeight: {
    type: Number,
    min: 0
  },
  shippingDimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ['cm', 'inch', 'mm'], default: 'cm' }
  },
  
  publishedAt: Date
}, {
  timestamps: true
});

// Indexes
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ subcategories: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ collections: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isNewLaunch: 1 });
productSchema.index({ isOnSale: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ publishedAt: -1 });

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  shortDescription: 'text',
  tags: 'text',
  collections: 'text'
});

// Virtual for calculating discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.salePrice && this.price && this.salePrice < this.price) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for checking if in stock
productSchema.virtual('inStock').get(function() {
  if (this.hasVariants) {
    return this.variants.some((variant: any) => 
      variant.isActive && 
      (!variant.inventory.trackQuantity || variant.inventory.quantity > 0)
    );
  }
  return !this.stockTracking || (this.stockQuantity || 0) > 0;
});

export const Product = model<IProduct>('Product', productSchema);

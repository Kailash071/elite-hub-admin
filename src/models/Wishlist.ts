import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlistItem {
  product: Types.ObjectId;
  variantId?: string; // If specific variant is wishlisted
  addedAt: Date;
  notes?: string; // Customer notes about the item
}

export interface IWishlist extends Document {
  customer: Types.ObjectId;
  name: string; // Wishlist name (e.g., "My Favorites", "Wedding Collection")
  description?: string;
  
  items: IWishlistItem[];
  
  // Privacy
  isPublic: boolean; // Can be shared with others
  shareToken?: string; // Unique token for sharing
  
  // Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: String,
    trim: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  }
});

const wishlistSchema = new Schema<IWishlist>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'My Wishlist'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  items: [wishlistItemSchema],
  
  // Privacy
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
wishlistSchema.index({ customer: 1 });
wishlistSchema.index({ shareToken: 1 });
wishlistSchema.index({ isPublic: 1 });
wishlistSchema.index({ 'items.product': 1 });

// Compound index for customer's active wishlists
wishlistSchema.index({ customer: 1, isActive: 1 });

// Virtual for total items count
wishlistSchema.virtual('totalItems').get(function() {
  return this.items.length;
});

// Method to add item to wishlist
wishlistSchema.methods.addItem = function(productId: string, variantId?: string, notes?: string) {
  // Check if item already exists
  const existingItem = this.items.find((item: IWishlistItem) => 
    item.product.toString() === productId && 
    (item.variantId === variantId || (!item.variantId && !variantId))
  );
  
  if (existingItem) {
    // Update existing item
    if (notes) existingItem.notes = notes;
    existingItem.addedAt = new Date();
  } else {
    // Add new item
    this.items.push({
      product: productId as any,
      variantId,
      notes,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId: string, variantId?: string) {
  const itemIndex = this.items.findIndex((item: IWishlistItem) => 
    item.product.toString() === productId && 
    (item.variantId === variantId || (!item.variantId && !variantId))
  );
  
  if (itemIndex > -1) {
    this.items.splice(itemIndex, 1);
    return this.save();
  }
  
  throw new Error('Item not found in wishlist');
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  return this.save();
};

// Method to generate share token
wishlistSchema.methods.generateShareToken = function() {
  if (!this.shareToken) {
    this.shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  return this.save();
};

// Static method to find customer's default wishlist
wishlistSchema.statics.findOrCreateDefault = function(customerId: string) {
  return this.findOneAndUpdate(
    { 
      customer: customerId, 
      name: 'My Wishlist', 
      isActive: true 
    },
    {},
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);

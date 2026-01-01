import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  variantId?: string; // If product has variants
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: Date;
}

export interface ICart extends Document {
  // Cart Ownership
  customer?: Types.ObjectId; // For logged-in users
  sessionId?: string; // For guest users
  
  // Cart Items
  items: ICartItem[];
  
  // Pricing
  subtotal: number;
  totalItems: number;
  
  // Cart Status
  isActive: boolean;
  
  // Timestamps
  lastUpdatedAt: Date;
  expiresAt: Date; // Auto-expire inactive carts
  
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 999
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new Schema<ICart>({
  // Cart Ownership - either customer or sessionId must be present
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true // Allows null values with index
  },
  sessionId: {
    type: String,
    trim: true,
    sparse: true // Allows null values with index
  },
  
  // Cart Items
  items: [cartItemSchema],
  
  // Calculated fields
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalItems: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Cart Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Guest carts expire in 7 days, user carts expire in 30 days
      const days = this.customer ? 30 : 7;
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ customer: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cartSchema.index({ isActive: 1 });
cartSchema.index({ lastUpdatedAt: -1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Compound index for finding active carts
cartSchema.index({ customer: 1, isActive: 1 });
cartSchema.index({ sessionId: 1, isActive: 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  // Calculate subtotal and total items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Update last updated timestamp
  this.lastUpdatedAt = new Date();
  
  // Extend expiry date on updates
  const days = this.customer ? 30 : 7;
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  next();
});

// Instance method to add item to cart
cartSchema.methods.addItem = function(productId: string, variantId: string | null, quantity: number, unitPrice: number) {
  // Find existing item
  const existingItemIndex = this.items.findIndex((item: ICartItem) => 
    item.product.toString() === productId && 
    (item.variantId === variantId || (!item.variantId && !variantId))
  );
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = this.items[existingItemIndex].quantity * unitPrice;
  } else {
    // Add new item
    this.items.push({
      product: productId as any,
      variantId: variantId || undefined,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId: string, variantId: string | null, quantity: number) {
  const itemIndex = this.items.findIndex((item: ICartItem) => 
    item.product.toString() === productId && 
    (item.variantId === variantId || (!item.variantId && !variantId))
  );
  
  if (itemIndex > -1) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      this.items.splice(itemIndex, 1);
    } else {
      // Update quantity and total price
      this.items[itemIndex].quantity = quantity;
      this.items[itemIndex].totalPrice = quantity * this.items[itemIndex].unitPrice;
    }
    
    return this.save();
  }
  
  throw new Error('Item not found in cart');
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId: string, variantId: string | null) {
  const itemIndex = this.items.findIndex((item: ICartItem) => 
    item.product.toString() === productId && 
    (item.variantId === variantId || (!item.variantId && !variantId))
  );
  
  if (itemIndex > -1) {
    this.items.splice(itemIndex, 1);
    return this.save();
  }
  
  throw new Error('Item not found in cart');
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Static method to find or create cart
cartSchema.statics.findOrCreateCart = function(customerId: string | null, sessionId: string | null) {
  if (customerId) {
    return this.findOneAndUpdate(
      { customer: customerId, isActive: true },
      {},
      { new: true, upsert: true }
    );
  } else if (sessionId) {
    return this.findOneAndUpdate(
      { sessionId, isActive: true },
      {},
      { new: true, upsert: true }
    );
  }
  
  throw new Error('Either customerId or sessionId must be provided');
};

// Static method to merge guest cart with user cart
cartSchema.statics.mergeGuestCart = async function(sessionId: string, customerId: string) {
  const guestCart = await this.findOne({ sessionId, isActive: true }).populate('items.product');
  const userCart = await this.findOne({ customer: customerId, isActive: true });
  
  if (!guestCart) return userCart;
  
  if (!userCart) {
    // Convert guest cart to user cart
    guestCart.customer = customerId;
    guestCart.sessionId = undefined;
    return guestCart.save();
  }
  
  // Merge items from guest cart to user cart
  for (const guestItem of guestCart.items) {
    const existingItemIndex = userCart.items.findIndex((item: ICartItem) => 
      item.product.toString() === guestItem.product.toString() && 
      item.variantId === guestItem.variantId
    );
    
    if (existingItemIndex > -1) {
      // Increase quantity of existing item
      userCart.items[existingItemIndex].quantity += guestItem.quantity;
      userCart.items[existingItemIndex].totalPrice = 
        userCart.items[existingItemIndex].quantity * userCart.items[existingItemIndex].unitPrice;
    } else {
      // Add new item
      userCart.items.push(guestItem);
    }
  }
  
  // Delete guest cart and save user cart
  await guestCart.deleteOne();
  return userCart.save();
};

export const Cart = model<ICart>('Cart', cartSchema);

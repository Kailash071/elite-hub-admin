import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  productName: string; // Store name for record keeping
  productSku?: string;
  variantId?: string; // If product has variants
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string; // Primary image URL
}

export interface IOrderAddress {
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
}

export interface IOrderShipping {
  method: string; // 'standard', 'express', 'overnight'
  carrier?: string; // 'BlueDart', 'DTDC', etc.
  trackingNumber?: string;
  trackingUrl?: string;
  cost: number;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

export interface IOrderPayment {
  method: 'cod' | 'prepaid' | 'card' | 'upi' | 'netbanking' | 'wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentGateway?: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
}

export interface IOrder extends Document {
  // Order Identification
  orderNumber: string; // Human readable order number
  
  // Customer Information
  customer: Types.ObjectId;
  customerEmail: string;
  customerPhone?: string;
  
  // Order Items
  items: IOrderItem[];
  
  // Addresses
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  
  // Pricing
  subtotal: number; // Sum of all item prices
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Discounts & Coupons
  couponCode?: string;
  couponDiscount?: number;
  
  // Order Status
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  orderNotes?: string;
  customerNotes?: string;
  adminNotes?: string;
  
  // Payment Information
  payment: IOrderPayment;
  
  // Shipping Information
  shipping: IOrderShipping;
  
  // Important Dates
  orderDate: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  returnedAt?: Date;
  
  // Fulfillment
  isGift: boolean;
  giftMessage?: string;
  
  // Currency
  currency: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productSku: {
    type: String,
    trim: true
  },
  variantId: {
    type: String,
    trim: true
  },
  variantName: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
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
  productImage: {
    type: String,
    trim: true
  }
});

const orderAddressSchema = new Schema<IOrderAddress>({
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
  }
});

const orderShippingSchema = new Schema<IOrderShipping>({
  method: {
    type: String,
    required: true,
    enum: ['standard', 'express', 'overnight'],
    default: 'standard'
  },
  carrier: {
    type: String,
    trim: true
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  trackingUrl: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  estimatedDelivery: Date,
  actualDelivery: Date
});

const orderPaymentSchema = new Schema<IOrderPayment>({
  method: {
    type: String,
    required: true,
    enum: ['cod', 'prepaid', 'card', 'upi', 'netbanking', 'wallet']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentGateway: {
    type: String,
    trim: true
  },
  paidAt: Date,
  refundedAt: Date,
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: {
    type: String,
    trim: true
  }
});

const orderSchema = new Schema<IOrder>({
  // Order Identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Customer Information
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  
  // Order Items
  items: [orderItemSchema],
  
  // Addresses
  shippingAddress: {
    type: orderAddressSchema,
    required: true
  },
  billingAddress: {
    type: orderAddressSchema,
    required: true
  },
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discountAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Coupons
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  couponDiscount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  orderNotes: {
    type: String,
    trim: true
  },
  customerNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Payment & Shipping
  payment: orderPaymentSchema,
  shipping: orderShippingSchema,
  
  // Important Dates
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  returnedAt: Date,
  
  // Additional Info
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: {
    type: String,
    trim: true,
    maxlength: 200
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    maxlength: 10
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.method': 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ totalAmount: -1 });
orderSchema.index({ couponCode: 1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

// Text search index
orderSchema.index({
  orderNumber: 'text',
  customerEmail: 'text',
  'items.productName': 'text',
  'shipping.trackingNumber': 'text'
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age in days
orderSchema.virtual('orderAgeInDays').get(function() {
  const now = new Date();
  const orderDate = this.orderDate;
  const diffTime = Math.abs(now.getTime() - orderDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export const Order = model<IOrder>('Order', orderSchema);

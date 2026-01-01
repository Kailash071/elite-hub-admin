/**
 * E-commerce Models Index
 * 
 * This file exports all database models for easy importing
 * throughout the application.
 */

// Core E-commerce Models
export { Customer } from './Customer.js';
export { Admin } from './Admin.js';
export { Role } from './Role.js';
export { Permission } from './Permission.js';
export { Category } from './Category.js';
export { Product } from './Product.js';
export { Order } from './Order.js';
export { Cart } from './Cart.js';

// Additional E-commerce Features
export { Review } from './Review.js';
export { Wishlist } from './Wishlist.js';
export { Coupon } from './Coupon.js';
export { Brand } from './Brand.js';
export { Banner } from './Banner.js';
export { Setting } from './Setting.js';

// Type exports for better TypeScript support
export type { ICustomer, ICustomerAddress } from './Customer.js';
export type { IAdmin } from './Admin.js';
export type { IRole } from './Role.js';
export type { IPermission } from './Permission.js';
export type { ICategory } from './Category.js';
export type { IProduct, IProductImage, IProductVariant } from './Product.js';
export type { IOrder, IOrderItem, IOrderAddress, IOrderShipping, IOrderPayment } from './Order.js';
export type { ICart, ICartItem } from './Cart.js';
export type { IReview } from './Review.js';
export type { IWishlist, IWishlistItem } from './Wishlist.js';
export type { ICoupon } from './Coupon.js';
export type { IBrand } from './Brand.js';
export type { IBanner } from './Banner.js';
export type { ISetting } from './Setting.js';

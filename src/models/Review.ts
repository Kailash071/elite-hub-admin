import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  // Review Basic Info
  product: Types.ObjectId;
  customer: Types.ObjectId;
  order?: Types.ObjectId; // Optional link to order (for verified purchases)
  
  // Review Content
  rating: number; // 1-5 stars
  title?: string;
  comment?: string;
  
  // Review Images (customer can upload photos)
  images: string[];
  
  // Verification
  isVerifiedPurchase: boolean;
  
  // Moderation
  isApproved: boolean;
  moderatedBy?: Types.ObjectId; // Customer who approved/rejected (admin account)
  moderatedAt?: Date;
  moderationNotes?: string;
  
  // Helpful votes
  helpfulVotes: number;
  totalVotes: number;
  
  // Reply from admin/store
  adminReply?: {
    content: string;
    repliedBy: Types.ObjectId;
    repliedAt: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Review Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Images
  images: [{
    type: String,
    trim: true
  }],
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  // Moderation
  isApproved: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  moderatedAt: Date,
  moderationNotes: {
    type: String,
    trim: true
  },
  
  // Helpful Votes
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Admin Reply
  adminReply: {
    content: {
      type: String,
      trim: true,
      maxlength: 500
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Customer'
    },
    repliedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ product: 1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ order: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });
reviewSchema.index({ createdAt: -1 });

// Compound indexes
reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ customer: 1, product: 1 }, { unique: true }); // One review per customer per product

// Text search index
reviewSchema.index({
  title: 'text',
  comment: 'text'
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / this.totalVotes) * 100);
});

export const Review = model<IReview>('Review', reviewSchema);

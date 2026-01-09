import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  displayName: string;
  slug: string;
  description?: string;
  image?: string;
  mainCategory?: Types.ObjectId | ICategory;
  mainCategoryName?: string;
  parentCategory?: Types.ObjectId | ICategory;
  parentCategoryName?: string;
  level: number; // 0 subcategory, 1 sub-subcategory
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: Boolean;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    // unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  image: {
    type: String,
    trim: true
  },
  mainCategory: {
    type: Schema.Types.ObjectId,
    ref: 'MainCategory',
    default: null
  },
  mainCategoryName: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  parentCategoryName: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
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
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });


export const Category = model<ICategory>('Category', categorySchema);

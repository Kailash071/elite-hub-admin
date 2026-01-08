import { Schema, model, Document, Types } from 'mongoose';

export interface IMainCategory extends Document {
    name: string;
    displayName: string;
    slug: string;
    description: string;
    image: string;
    isActive: boolean;
    sortOrder: number;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
}

const mainCategorySchema = new Schema<IMainCategory>({
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
        unique: true,
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
        trim: true,
    }]
}, {
    timestamps: true
});

export const MainCategory = model<IMainCategory>('MainCategory', mainCategorySchema);

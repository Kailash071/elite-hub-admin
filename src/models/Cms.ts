import { Schema, model, Document } from 'mongoose';

export interface ICms extends Document {
    title: string;
    content: string;
    type: string;
    image?: string;
    isActive: boolean;
    sortOrder: number;
    isDeleted: boolean;
}

const cmsSchema = new Schema<ICms>({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true,
        enum: ['privacy-policy', 'return-policy', 'shipping-policy', 'terms-conditions', 'about-us']
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
    isDeleted: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

export const Cms = model<ICms>('Cms', cmsSchema);

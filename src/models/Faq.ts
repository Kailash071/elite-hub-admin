import { Schema, model, Document } from 'mongoose';

export interface IFaq extends Document {
    question: string;
    answer: string;
    isActive: boolean;
    sortOrder: number;
    isDeleted: boolean;
}

const faqSchema = new Schema<IFaq>({
    question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    answer: {
        type: String,
        required: true,
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

export const Faq = model<IFaq>('Faq', faqSchema);
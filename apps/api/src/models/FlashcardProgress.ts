import mongoose, { Schema, type InferSchemaType } from "mongoose";

const FlashcardProgressSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        kitId: {
            type: Schema.Types.ObjectId,
            ref: "Kit",
            required: true,
            index: true,
        },

        flashcardId: {
            type: String,
            required: true,
        },

        // 1 = needs work, 2 = okay, 3 = confident
        confidence: {
            type: Number,
            enum: [1, 2, 3],
            required: true,
        },

        covered: {
            type: Boolean,
            default: false,
        },

        reviewCount: {
            type: Number,
            default: 0,
        },

        lastReviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

FlashcardProgressSchema.index(
    {
        userId: 1,
        kitId: 1,
        flashcardId: 1,
    },
    {
        unique: true,
    },
);

export type FlashcardProgress =
    InferSchemaType<typeof FlashcardProgressSchema>;

export const FlashcardProgressModel =
    mongoose.model<FlashcardProgress>(
        "FlashcardProgress",
        FlashcardProgressSchema,
    );
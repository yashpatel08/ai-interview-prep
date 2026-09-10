import { Schema, model, type InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

// MongoDB automatically removes expired sessions.
sessionSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
);

export type Session = InferSchemaType<
    typeof sessionSchema
>;

export const SessionModel = model(
    "Session",
    sessionSchema,
);
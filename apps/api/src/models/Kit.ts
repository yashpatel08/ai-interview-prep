import { Schema, model, type InferSchemaType } from "mongoose";

const generationErrorSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    },
);

const generationSchema = new Schema(
    {
        status: {
            type: String,
            enum: [
                "queued",
                "researching_company",
                "extracting_requirements",
                "generating_company_brief",
                "generating_questions",
                "checking_coverage",
                "closing_gaps",
                "generating_flashcards",
                "building_schedule",
                "validating",
                "complete",
                "failed",
            ],
            required: true,
            default: "queued",
        },

        progress: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0,
        },

        error: {
            type: generationErrorSchema,
            default: null,
        },

        startedAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        _id: false,
    },
);

const kitSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        sourceHash: {
            type: String,
            required: true,
            index: true,
        },

        source: {
            company: {
                type: String,
                default: "",
            },

            company_url: {
                type: String,
                required: true,
            },

            role: {
                type: String,
                default: "",
            },

            location: {
                type: String,
                default: "",
            },

            jd_chars: {
                type: Number,
                default: 0,
            },

            jd: {
                type: String,
                required: true,
            }
        },

        status: {
            type: String,
            enum: ["generating", "ready", "failed"],
            required: true,
            default: "generating",
            index: true,
        },

        generation: {
            type: generationSchema,
            required: true,
        },

        kit: {
            type: Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

kitSchema.index(
    {
        userId: 1,
        sourceHash: 1,
    },
    {
        unique: true,
    },
);

export type Kit = InferSchemaType<typeof kitSchema>;

export const KitModel = model("Kit", kitSchema);
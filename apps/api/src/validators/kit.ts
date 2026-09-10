import { z } from "zod";

export const createKitSchema = z.object({
    jd: z.string().trim().min(50).max(100_000),
    company_url: z.string().url(),
    days_available: z.coerce.number().int().min(1).max(60).default(5),
});

const DifficultySchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
]);

const QuestionCategorySchema = z.enum([
    "technical",
    "behavioral",
    "system_design",
    "company_fit",
]);

const QuestionSchema = z.object({
    id: z.string().min(1),
    requirement_ids: z.array(z.string()),
    category: QuestionCategorySchema,
    prompt: z.string().min(1).max(10_000),
    answer_outline: z.string().min(1).max(20_000),
    difficulty: DifficultySchema,
    state: z
        .enum(["generated", "edited", "pinned"])
        .optional(),

    state_before_pin: z
        .enum(["generated", "edited"])
        .optional(),
});

const FlashcardSchema = z.object({
    id: z.string().min(1),
    front: z.string().min(1).max(10_000),
    back: z.string().min(1).max(20_000),
    requirement_ids: z.array(z.string()),
});

export const updateQuestionSchema = z.object({
    prompt: z.string().trim().min(1).max(10_000).optional(),
    answer_outline: z.string().trim().min(1).max(20_000).optional(),
    category: QuestionCategorySchema.optional(),
    difficulty: DifficultySchema.optional(),
    requirement_ids: z.array(z.string().min(1)).optional(),
}).refine(
    (value) => Object.keys(value).length > 0,
    {
        message: "At least one question field is required.",
    },
);

export const createQuestionSchema = QuestionSchema.omit({
    id: true,
});

export const createFlashcardSchema = FlashcardSchema.omit({
    id: true,
});

export const updateKitSchema = z.object({
    source: z.object({
        company: z.string().max(500).optional(),
        role: z.string().max(500).optional(),
        location: z.string().max(500).optional(),
    }).optional(),
});

export const updateFlashcardSchema = z.object({
    front: z.string()
        .trim()
        .min(1)
        .max(10_000)
        .optional(),

    back: z.string()
        .trim()
        .min(1)
        .max(20_000)
        .optional(),

    requirement_ids: z
        .array(z.string().min(1))
        .optional(),
}).refine(
    (value) =>
        Object.keys(value).length > 0,
    {
        message:
            "At least one flashcard field is required.",
    },
);

export const reviewFlashcardSchema = z.object({
    confidence: z.coerce
        .number()
        .int()
        .min(1)
        .max(3),
});

export const pinContentSchema = z.object({
    pinned: z.boolean(),
});

import { z } from "zod";

export const regenerateSectionSchema = z
    .object({
        section: z.enum([
            "company_brief",
            "questions",
            "flashcards",
        ]),
        category: z
            .enum([
                "technical",
                "behavioral",
                "system_design",
                "company_fit",
            ])
            .optional(),
    })
    .superRefine((value, ctx) => {
        if (value.section !== "questions" && value.category) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["category"],
                message:
                    "Category is only allowed when regenerating questions.",
            });
        }
    });
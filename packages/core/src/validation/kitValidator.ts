import { z } from "zod";

const RequirementKindSchema = z.enum([
    "technical",
    "experience",
    "education",
    "responsibility",
    "soft_skill",
    "company",
    "other",
]);

const RequirementPrioritySchema = z.enum(["must", "nice"]);

const QuestionCategorySchema = z.enum([
    "technical",
    "behavioral",
    "system_design",
    "company_fit",
]);

const RequirementSchema = z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    kind: RequirementKindSchema,
    priority: RequirementPrioritySchema,
});

const QuestionSchema = z.object({
    id: z.string().min(1),
    requirement_ids: z.array(z.string().min(1)),
    category: QuestionCategorySchema,
    prompt: z.string().min(1),
    answer_outline: z.string().min(1),
    difficulty: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
    ]),
});

const FlashcardSchema = z.object({
    id: z.string().min(1),
    front: z.string().min(1),
    back: z.string().min(1),
    requirement_ids: z.array(z.string().min(1)),
});

const ScheduleDaySchema = z.object({
    day: z.number().int().positive(),
    focus: z.string().min(1),
    question_ids: z.array(z.string().min(1)),
    minutes: z.number().int().nonnegative(),
});

const SourceSchema = z.object({
    company: z.string(),
    company_url: z.string().url(),
    role: z.string(),
    location: z.string(),

    jd_chars: z
        .number()
        .int()
        .nonnegative(),

    jd: z
        .string()
        .min(1),

    researched_at: z.string(),

    pages_used: z.array(
        z.string().url(),
    ),
});

export const InterviewKitSchema = z.object({
    source: z.object({
        company: z.string(),
        company_url: z.string().url(),
        role: z.string(),
        location: z.string(),

        jd_chars: z
            .number()
            .int()
            .nonnegative(),

        jd: z
            .string()
            .min(1),

        researched_at: z.string(),

        pages_used: z.array(
            z.string().url(),
        ),
    }),

    company_brief: z.object({
        summary: z.string().min(1),
        what_they_do: z.string().min(1),
        sources: z.array(z.string().url()),
    }),

    role: z.object({
        title: z.string().min(1),
        seniority: z.string().min(1),
        responsibilities: z.array(z.string().min(1)),
        requirements: z.array(RequirementSchema),
    }),

    questions: z.array(QuestionSchema),

    flashcards: z.array(FlashcardSchema),

    schedule: z.object({
        days_available: z.number().int().positive(),
        days: z.array(ScheduleDaySchema),
    }),

    coverage: z.object({
        uncovered_requirement_ids: z.array(z.string().min(1)),
        passes: z.number().int().nonnegative(),
    }),
});

export type ValidatedInterviewKit = z.infer<
    typeof InterviewKitSchema
>;

export function validateInterviewKit(
    input: unknown,
): ValidatedInterviewKit {
    return InterviewKitSchema.parse(input);
}

export function safeValidateInterviewKit(input: unknown) {
    return InterviewKitSchema.safeParse(input);
}

export function validateKitRelationships(
    kit: ValidatedInterviewKit,
): string[] {
    const errors: string[] = [];

    const requirementIds = new Set(
        kit.role.requirements.map((requirement) => requirement.id),
    );

    const questionIds = new Set(
        kit.questions.map((question) => question.id),
    );

    // Duplicate requirement IDs
    if (requirementIds.size !== kit.role.requirements.length) {
        errors.push("Duplicate requirement IDs found.");
    }

    // Duplicate question IDs
    if (questionIds.size !== kit.questions.length) {
        errors.push("Duplicate question IDs found.");
    }

    // Duplicate flashcard IDs
    const flashcardIds = new Set(
        kit.flashcards.map((flashcard) => flashcard.id),
    );

    if (flashcardIds.size !== kit.flashcards.length) {
        errors.push("Duplicate flashcard IDs found.");
    }

    // Questions must reference existing requirements
    for (const question of kit.questions) {
        for (const requirementId of question.requirement_ids) {
            if (!requirementIds.has(requirementId)) {
                errors.push(
                    `Question ${question.id} references unknown requirement ${requirementId}.`,
                );
            }
        }
    }

    // Flashcards must reference existing requirements
    for (const flashcard of kit.flashcards) {
        for (const requirementId of flashcard.requirement_ids) {
            if (!requirementIds.has(requirementId)) {
                errors.push(
                    `Flashcard ${flashcard.id} references unknown requirement ${requirementId}.`,
                );
            }
        }
    }

    // Schedule must reference existing questions
    for (const day of kit.schedule.days) {
        for (const questionId of day.question_ids) {
            if (!questionIds.has(questionId)) {
                errors.push(
                    `Schedule day ${day.day} references unknown question ${questionId}.`,
                );
            }
        }
    }

    // Schedule must contain exactly the declared number of days
    if (kit.schedule.days.length !== kit.schedule.days_available) {
        errors.push(
            `Schedule contains ${kit.schedule.days.length} days but days_available is ${kit.schedule.days_available}.`,
        );
    }

    // Day numbers should be sequential
    kit.schedule.days.forEach((day, index) => {
        if (day.day !== index + 1) {
            errors.push(
                `Schedule day numbering is invalid at index ${index}.`,
            );
        }
    });

    // Must-have requirements must not remain uncovered
    const mustRequirements = kit.role.requirements.filter(
        (requirement) => requirement.priority === "must",
    );

    const coveredRequirements = new Set(
        kit.questions.flatMap(
            (question) => question.requirement_ids,
        ),
    );

    for (const requirement of mustRequirements) {
        if (!coveredRequirements.has(requirement.id)) {
            errors.push(
                `Must-have requirement ${requirement.id} is not covered by any question.`,
            );
        }
    }

    return errors;
}
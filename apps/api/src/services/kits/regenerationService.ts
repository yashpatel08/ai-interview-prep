import type {
    Flashcard,
    InterviewKit,
    Question,
    QuestionCategory,
} from "@ai-interview-prep/core";
import z from "zod";
import { llmClient } from "../llm/llmClient.js";
import { createStableId } from "../generation/ids.js";
import {
    buildSchedule,
    validateInterviewKit,
    validateKitRelationships,
    findUncoveredRequirements,
} from "@ai-interview-prep/core";
import {
    mergeRegeneratedQuestions,
} from "./questionMerge.js";

type RegeneratableSection =
    | "company_brief"
    | "questions"
    | "flashcards";

interface RegenerateInput {
    kit: InterviewKit;
    section: RegeneratableSection;
    category?: QuestionCategory;
}

interface GeneratedQuestions {
    questions: Array<{
        requirement_ids: string[];
        category: QuestionCategory;
        prompt: string;
        answer_outline: string;
        difficulty: 1 | 2 | 3;
    }>;
}

interface GeneratedFlashcards {
    flashcards: Array<{
        front: string;
        back: string;
        requirement_ids: string[];
    }>;
}

function requirementContext(
    kit: InterviewKit,
): string {
    return kit.role.requirements
        .map(
            requirement =>
                `${requirement.id}: ${requirement.text} (${requirement.priority})`,
        )
        .join("\n");
}

const CompanyBriefSchema = z.object({
    summary: z.string().min(1),
    what_they_do: z.string().min(1),
});

const GeneratedQuestionsSchema = z.object({
    questions: z.array(
        z.object({
            requirement_ids: z.array(
                z.string().min(1),
            ),
            category: z.enum([
                "technical",
                "behavioral",
                "system_design",
                "company_fit",
            ]),
            prompt: z.string().min(1),
            answer_outline: z.string().min(1),
            difficulty: z.union([
                z.literal(1),
                z.literal(2),
                z.literal(3),
            ]),
        }),
    ),
});

const GeneratedFlashcardsSchema = z.object({
    flashcards: z.array(
        z.object({
            front: z.string().min(1),
            back: z.string().min(1),
            requirement_ids: z.array(
                z.string().min(1),
            ),
        }),
    ),
});

async function regenerateCompanyBrief(
    kit: InterviewKit,
): Promise<InterviewKit["company_brief"]> {
    const result =
        await llmClient.generateJson(
            {
                systemPrompt: `
You generate a concise company brief for an interview preparation kit.

Use ONLY the supplied company research.
Do not invent facts.

Return valid JSON only with:
{
  "summary": "...",
  "what_they_do": "..."
}
            `.trim(),
                userPrompt: JSON.stringify({
                    company: kit.source.company,
                    company_url:
                        kit.source.company_url,
                    research_pages:
                        kit.source.pages_used,
                    current_brief:
                        kit.company_brief,
                }),
            },
            CompanyBriefSchema.parse,
        );

    return {
        summary: result.summary,
        what_they_do: result.what_they_do,
        sources: [...kit.company_brief.sources],
    };
}

async function regenerateQuestions(
    kit: InterviewKit,
    category?: QuestionCategory,
): Promise<Question[]> {
    const categories: QuestionCategory[] =
        category
            ? [category]
            : [
                "technical",
                "behavioral",
                "system_design",
                "company_fit",
            ];

    const generated: Question[] = [];

    for (const questionCategory of categories) {
        const result =
            await llmClient.generateJson(
                {
                    systemPrompt: `
Generate interview questions for the specified category.

Important rules:
- Use ONLY the supplied job description and requirements.
- Every requirement_id must exist in the supplied requirements.
- Do not invent requirement IDs.
- Questions must be useful for interview preparation.
- Difficulty must be 1, 2, or 3.
- Return JSON only.

Schema:
{
  "questions": [
    {
      "requirement_ids": ["r1"],
      "category": "technical",
      "prompt": "...",
      "answer_outline": "...",
      "difficulty": 1
    }
  ]
}
            `.trim(),
                    userPrompt: JSON.stringify({
                        company: kit.source.company,
                        role: kit.role,
                        requirements:
                            requirementContext(kit),
                        category: questionCategory,
                        job_description:
                            kit.source.jd,
                    }),
                },
                GeneratedQuestionsSchema.parse,
            );

        for (const question of result.questions) {
            generated.push({
                id: createStableId("q"),
                requirement_ids:
                    question.requirement_ids,
                category:
                    question.category,
                prompt: question.prompt,
                answer_outline:
                    question.answer_outline,
                difficulty:
                    question.difficulty,
                state: "generated",
            });
        }
    }

    return generated;
}

async function regenerateFlashcards(
    kit: InterviewKit,
): Promise<Flashcard[]> {
    const result =
        await llmClient.generateJson(
            {
                systemPrompt: `
Generate interview preparation flashcards.

Use ONLY the supplied job description and requirements.
Every requirement_id must exist.
Return concise but useful cards.
Return JSON only.

Schema:
{
  "flashcards": [
    {
      "front": "...",
      "back": "...",
      "requirement_ids": ["r1"]
    }
  ]
}
            `.trim(),
                userPrompt: JSON.stringify({
                    company: kit.source.company,
                    role: kit.role,
                    requirements:
                        requirementContext(kit),
                    job_description:
                        kit.source.jd,
                }),
            },
            GeneratedFlashcardsSchema.parse,
        );

    return result.flashcards.map(
        flashcard => ({
            id: createStableId("f"),
            front: flashcard.front,
            back: flashcard.back,
            requirement_ids:
                flashcard.requirement_ids,
            state: "generated",
        }),
    );
}

export async function repairCoverage(
    kit: InterviewKit,
): Promise<InterviewKit> {
    let next = structuredClone(kit);

    for (let pass = 1; pass <= 3; pass += 1) {
        const uncoveredIds =
            findUncoveredRequirements(
                next.role.requirements,
                next.questions,
            );

        if (uncoveredIds.length === 0) {
            next.coverage = {
                uncovered_requirement_ids: [],
                passes: pass,
            };

            return next;
        }

        const uncoveredRequirements =
            next.role.requirements.filter(
                (requirement) =>
                    uncoveredIds.includes(
                        requirement.id,
                    ),
            );

        const generated =
            await llmClient.generateJson(
                {
                    systemPrompt: `
You generate targeted interview questions.

Generate questions ONLY for the supplied uncovered
requirements.

Return valid JSON only.

Do not invent requirement IDs.
Each question must reference at least one supplied
requirement ID.
                    `.trim(),

                    userPrompt: JSON.stringify({
                        requirements:
                            uncoveredRequirements,
                    }),
                },

                GeneratedQuestionsSchema.parse,
            );

        const newQuestions =
            generated.questions.map(
                (question) => ({
                    ...question,
                    id: createStableId("q"),
                    state: "generated" as const,
                }),
            );

        next.questions = [
            ...next.questions,
            ...newQuestions,
        ];

        next.coverage = {
            uncovered_requirement_ids:
                findUncoveredRequirements(
                    next.role.requirements,
                    next.questions,
                ),
            passes: pass,
        };
    }

    return next;
} 

export async function regenerateSection(
    input: RegenerateInput,
): Promise<InterviewKit> {
    const original = structuredClone(
        input.kit,
    );

    let next = structuredClone(
        input.kit,
    );

    switch (input.section) {
        case "company_brief":
            next.company_brief =
                await regenerateCompanyBrief(
                    original,
                );
            break;

        case "questions": {
            const regeneratedQuestions =
                await regenerateQuestions(
                    original,
                    input.category,
                );

            next.questions =
                mergeRegeneratedQuestions(
                    original,
                    regeneratedQuestions,
                    input.category,
                );

            next.schedule = {
                days_available:
                    next.schedule.days_available,

                days: buildSchedule({
                    daysAvailable:
                        next.schedule.days_available,

                    requirements:
                        next.role.requirements,

                    questions:
                        next.questions,
                }),
            };

            break;
        }

        case "flashcards": {
            const regeneratedFlashcards =
                await regenerateFlashcards(
                    original,
                );

            const preservedFlashcards =
                original.flashcards.filter(
                    flashcard =>
                        flashcard.state === "edited" ||
                        flashcard.state === "pinned",
                );

            next.flashcards = [
                ...preservedFlashcards,
                ...regeneratedFlashcards,
            ];

            break;
        }
    }

    next = await repairCoverage(next);

    validateInterviewKit(next);
    validateKitRelationships(next);

    return next;
}
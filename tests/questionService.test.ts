import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
} from "vitest";

import type { InterviewKit } from "@ai-interview-prep/core";

const mockSave = vi.fn();

const mockQuestion = {
    id: "q1",
    requirement_ids: ["r1"],
    category: "technical" as const,
    prompt: "Original question",
    answer_outline: "Original answer",
    difficulty: 2 as const,
    state: "generated" as const,
};

const mockQuestion2 = {
    id: "q2",
    requirement_ids: ["r2"],
    category: "behavioral" as const,
    prompt: "Second question",
    answer_outline: "Second answer",
    difficulty: 1 as const,
    state: "generated" as const,
};

const mockQuestion3 = {
    id: "q3",
    requirement_ids: ["r1"],
    category: "system_design" as const,
    prompt: "Third question",
    answer_outline: "Third answer",
    difficulty: 3 as const,
    state: "generated" as const,
};

function makeKit(): InterviewKit {
    return {
        source: {
            company: "Acme",
            company_url:
                "https://example.com",
            role: "Backend Engineer",
            location: "",
            jd_chars: 100,
            jd: "Backend engineer job description",
            researched_at:
                "2026-01-01T00:00:00.000Z",
            pages_used: [],
        },

        company_brief: {
            summary: "Acme summary",
            what_they_do:
                "Acme builds software.",
            sources: [],
        },

        role: {
            title: "Backend Engineer",
            seniority: "Senior",
            responsibilities: [
                "Build APIs",
            ],
            requirements: [
                {
                    id: "r1",
                    text: "Node.js experience",
                    kind: "technical",
                    priority: "must",
                },
                {
                    id: "r2",
                    text: "Communication skills",
                    kind: "soft_skill",
                    priority: "nice",
                },
            ],
        },

        questions: [
            structuredClone(mockQuestion),
            structuredClone(mockQuestion2),
            structuredClone(mockQuestion3),
        ],

        flashcards: [
            {
                id: "f1",
                front: "What is Node.js?",
                back: "A JavaScript runtime.",
                requirement_ids: ["r1"],
                state: "generated",
            },
        ],

        schedule: {
            days_available: 2,
            days: [
                {
                    day: 1,
                    focus: "Technical",
                    question_ids: [
                        "q1",
                        "q2",
                    ],
                    minutes: 25,
                },
                {
                    day: 2,
                    focus: "System Design",
                    question_ids: ["q3"],
                    minutes: 20,
                },
            ],
        },

        coverage: {
            uncovered_requirement_ids: [],
            passes: 1,
        },
    };
}

const mockKitDocument = {
    kit: makeKit(),
    markModified: vi.fn(),
    save: mockSave,
};

vi.mock(
    "../apps/api/src/models/Kit.js",
    () => ({
        KitModel: {
            findOne: vi.fn(
                () => mockKitDocument,
            ),
        },
    }),
);

/*
 * IMPORTANT:
 * questionService.ts imports createStableId from:
 *
 * ../generation/ids.js
 *
 * Therefore the mock must target that exact module.
 */
vi.mock(
    "../apps/api/src/services/generation/ids.js",
    () => ({
        createStableId: vi.fn(
            (prefix: string) =>
                `${prefix}-new`,
        ),
    }),
);

vi.mock(
    "../apps/api/src/services/kits/scheduleQuestionService.js",
    () => ({
        addQuestionToSchedule: vi.fn(
            (
                kit: InterviewKit,
                question,
            ) => kit.schedule,
        ),

        removeQuestionFromSchedule:
            vi.fn(
                (
                    kit: InterviewKit,
                    questionId: string,
                ) => kit.schedule,
            ),

        updateQuestionScheduleMinutes:
            vi.fn(
                (
                    kit: InterviewKit,
                    questionId: string,
                    oldDifficulty: number,
                    newDifficulty: number,
                ) => kit.schedule,
            ),
    }),
);

import {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
} from "../apps/api/src/services/kits/questionService.js";

describe("question service", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockKitDocument.kit =
            makeKit();

        mockSave.mockResolvedValue(
            mockKitDocument,
        );
    });

    it("updates a question", async () => {
        const result =
            await updateQuestion(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                {
                    prompt:
                        "Updated question",
                    answer_outline:
                        "Updated answer",
                },
            );

        expect(result).toBeDefined();

        const question =
            result?.kit?.questions.find(
                (q) => q.id === "q1",
            );

        expect(question?.prompt).toBe(
            "Updated question",
        );

        expect(
            question?.answer_outline,
        ).toBe("Updated answer");

        expect(question?.state).toBe(
            "edited",
        );

        expect(
            mockSave,
        ).toHaveBeenCalled();
    });

    it("preserves pinned state when updating a question", async () => {
        const kit = makeKit();

        const firstQuestion =
            kit.questions[0];

        expect(firstQuestion).toBeDefined();

        if (!firstQuestion) {
            throw new Error(
                "Expected q1 to exist in test fixture.",
            );
        }

        firstQuestion.state =
            "pinned";

        firstQuestion.state_before_pin =
            "edited";

        mockKitDocument.kit = kit;

        const result =
            await updateQuestion(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                {
                    prompt:
                        "Updated pinned question",
                },
            );

        expect(result).toBeDefined();

        const question =
            result?.kit?.questions.find(
                (q) => q.id === "q1",
            );

        expect(question?.prompt).toBe(
            "Updated pinned question",
        );

        expect(question?.state).toBe(
            "pinned",
        );

        expect(
            question?.state_before_pin,
        ).toBe("edited");
    });

    it("marks a generated question as edited when changed", async () => {
        const result =
            await updateQuestion(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                {
                    prompt:
                        "Changed generated question",
                },
            );

        const question =
            result?.kit?.questions.find(
                (q) => q.id === "q1",
            );

        expect(question?.state).toBe(
            "edited",
        );
    });

    it("updates requirement ids", async () => {
        const result =
            await updateQuestion(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                {
                    requirement_ids: ["r2"],
                },
            );

        const question =
            result?.kit?.questions.find(
                (q) => q.id === "q1",
            );

        expect(
            question?.requirement_ids,
        ).toEqual(["r2"]);
    });

    it("adds a new question", async () => {
        const result =
            await addQuestion(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                {
                    requirement_ids: ["r1"],
                    category: "technical",
                    prompt: "New question",
                    answer_outline:
                        "New answer",
                    difficulty: 2,
                },
            );

        expect(result).toBeDefined();

        const question =
            result?.kit?.questions.find(
                (q) => q.id === "q-new",
            );

        expect(question).toBeDefined();

        expect(question?.prompt).toBe(
            "New question",
        );

        expect(question?.answer_outline).toBe(
            "New answer",
        );

        expect(
            question?.requirement_ids,
        ).toEqual(["r1"]);

        expect(question?.difficulty).toBe(
            2,
        );

        expect(question?.state).toBe(
            "edited",
        );

        expect(
            mockSave,
        ).toHaveBeenCalled();
    });

    it("deletes a question", async () => {
        const result =
            await deleteQuestion(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
            );

        expect(result).toBeDefined();

        expect(
            result?.kit?.questions.some(
                (q) => q.id === "q1",
            ),
        ).toBe(false);

        expect(
            mockSave,
        ).toHaveBeenCalled();
    });

    it("reorders questions", async () => {
        const result =
            await reorderQuestions(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                [
                    "q3",
                    "q1",
                    "q2",
                ],
            );

        expect(result).toBeDefined();

        expect(
            result?.kit?.questions.map(
                (q) => q.id,
            ),
        ).toEqual([
            "q3",
            "q1",
            "q2",
        ]);

        expect(
            mockSave,
        ).toHaveBeenCalled();
    });

    it("rejects an invalid question order", async () => {
        await expect(
            reorderQuestions(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                ["q1", "q2"],
            ),
        ).rejects.toThrow(
            "QUESTION_ORDER_MISMATCH",
        );
    });

    it("rejects an unknown requirement when adding a question", async () => {
        await expect(
            addQuestion(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                {
                    requirement_ids: [
                        "does-not-exist",
                    ],
                    category: "technical",
                    prompt: "New question",
                    answer_outline:
                        "New answer",
                    difficulty: 2,
                },
            ),
        ).rejects.toThrow(
            "INVALID_REQUIREMENT_ID",
        );
    });
}); 

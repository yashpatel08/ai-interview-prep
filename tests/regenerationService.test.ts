import {
    describe,
    expect,
    it,
} from "vitest";

import type {
    InterviewKit,
} from "@ai-interview-prep/core";
import {
    mergeRegeneratedQuestions,
} from "../apps/api/src/services/kits/questionMerge.js";

function makeKit(): InterviewKit {
    return {
        source: {
            company: "Acme",
            company_url: "https://example.com",
            role: "Frontend Developer",
            location: "Remote",
            jd_chars: 500,
            jd: "Frontend developer role",
            researched_at:
                new Date().toISOString(),
            pages_used: [
                "https://example.com",
            ],
        },

        company_brief: {
            summary: "Acme builds software.",
            what_they_do:
                "Acme provides business software.",
            sources: [
                "https://example.com",
            ],
        },

        role: {
            title: "Frontend Developer",
            seniority: "Mid-level",
            responsibilities: [
                "Build frontend applications",
            ],
            requirements: [
                {
                    id: "r1",
                    text: "5+ years with React",
                    kind: "technical",
                    priority: "must",
                },
                {
                    id: "r2",
                    text: "Good communication",
                    kind: "soft_skill",
                    priority: "nice",
                },
            ],
        },

        questions: [
            {
                id: "q1",
                requirement_ids: ["r1"],
                category: "technical",
                prompt: "Original generated question",
                answer_outline: "React answer",
                difficulty: 2,
                state: "generated",
            },
            {
                id: "q2",
                requirement_ids: ["r1"],
                category: "technical",
                prompt: "Edited question",
                answer_outline: "Edited answer",
                difficulty: 2,
                state: "edited",
            },
            {
                id: "q3",
                requirement_ids: ["r2"],
                category: "behavioral",
                prompt: "Behavioral question",
                answer_outline: "Behavioral answer",
                difficulty: 1,
                state: "generated",
            },
        ],

        flashcards: [],

        schedule: {
            days_available: 2,
            days: [],
        },

        coverage: {
            uncovered_requirement_ids: [],
            passes: 1,
        },
    };
}

describe("mergeRegeneratedQuestions", () => {
    it("preserves edited questions", () => {
        const kit = makeKit();

        const regenerated = [
            {
                id: "q-new",
                requirement_ids: ["r1"],
                category: "technical" as const,
                prompt: "New generated question",
                answer_outline: "New answer",
                difficulty: 1 as const,
                state: "generated" as const,
            },
        ];

        const result =
            mergeRegeneratedQuestions(
                kit,
                regenerated,
                "technical",
            );

        expect(
            result.some(
                (q) => q.id === "q2",
            ),
        ).toBe(true);

        expect(
            result.find(
                (q) => q.id === "q2",
            )?.prompt,
        ).toBe("Edited question");
    });

    it("does not preserve generated questions in regenerated category", () => {
        const kit = makeKit();

        const regenerated = [
            {
                id: "q-new",
                requirement_ids: ["r1"],
                category: "technical" as const,
                prompt: "New generated question",
                answer_outline: "New answer",
                difficulty: 1 as const,
                state: "generated" as const,
            },
        ];

        const result =
            mergeRegeneratedQuestions(
                kit,
                regenerated,
                "technical",
            );

        expect(
            result.some(
                (q) => q.id === "q1",
            ),
        ).toBe(false);

        expect(
            result.some(
                (q) => q.id === "q-new",
            ),
        ).toBe(true);
    });

    it("leaves other categories untouched", () => {
        const kit = makeKit();

        const regenerated = [
            {
                id: "q-new",
                requirement_ids: ["r1"],
                category: "technical" as const,
                prompt: "New technical question",
                answer_outline: "New answer",
                difficulty: 1 as const,
                state: "generated" as const,
            },
        ];

        const result =
            mergeRegeneratedQuestions(
                kit,
                regenerated,
                "technical",
            );

        const behavioral =
            result.find(
                (q) => q.id === "q3",
            );

        expect(behavioral).toBeDefined();
        expect(behavioral?.prompt).toBe(
            "Behavioral question",
        );
    });

    it("preserves pinned questions", () => {
        const kit = makeKit();

        const firstQuestion = kit.questions[0];

        expect(firstQuestion).toBeDefined();

        if (!firstQuestion) {
            throw new Error(
                "Expected q1 to exist in test fixture.",
            );
        }

        firstQuestion.state = "pinned";

        const regenerated = [
            {
                id: "q-new",
                requirement_ids: ["r1"],
                category: "technical" as const,
                prompt: "New generated question",
                answer_outline: "New answer",
                difficulty: 1 as const,
                state: "generated" as const,
            },
        ];

        const result =
            mergeRegeneratedQuestions(
                kit,
                regenerated,
                "technical",
            );

        const pinned =
            result.find(
                (q) => q.id === "q1",
            );

        expect(pinned).toBeDefined();
        expect(pinned?.state).toBe(
            "pinned",
        );
    });
});
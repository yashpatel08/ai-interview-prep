import { describe, expect, it } from "vitest";

import {
    validateInterviewKit,
    validateKitRelationships,
    type InterviewKit,
} from "../packages/core/src/index.js";

const validKit: InterviewKit = {
    source: {
        company: "Acme",
        company_url: "https://example.com",
        role: "Senior Software Engineer",
        location: "Remote",
        jd_chars: 5000,
        jd: "We are looking for a Senior Software Engineer with 5+ years of React experience.",
        researched_at: "2026-09-09T10:00:00.000Z",
        pages_used: ["https://example.com/careers"],
    },

    company_brief: {
        summary: "Acme builds software products.",
        what_they_do: "Acme provides software services.",
        sources: ["https://example.com"],
    },

    role: {
        title: "Senior Software Engineer",
        seniority: "Senior",
        responsibilities: ["Build web applications"],
        requirements: [
            {
                id: "r1",
                text: "5+ years with React",
                kind: "technical",
                priority: "must",
            },
        ],
    },

    questions: [
        {
            id: "q1",
            requirement_ids: ["r1"],
            category: "technical",
            prompt: "Explain React rendering.",
            answer_outline: "Discuss reconciliation.",
            difficulty: 2,
        },
    ],

    flashcards: [
        {
            id: "f1",
            front: "What is reconciliation?",
            back: "React's process for determining UI updates.",
            requirement_ids: ["r1"],
        },
    ],

    schedule: {
        days_available: 1,
        days: [
            {
                day: 1,
                focus: "Technical preparation",
                question_ids: ["q1"],
                minutes: 15,
            },
        ],
    },

    coverage: {
        uncovered_requirement_ids: [],
        passes: 1,
    },
};

describe("InterviewKitSchema", () => {
    it("accepts a valid kit", () => {
        const result = validateInterviewKit(validKit);

        expect(result.source.company).toBe("Acme");
        expect(result.questions).toHaveLength(1);
    });

    it("rejects invalid difficulty", () => {
        const invalid = structuredClone(validKit);

        (invalid.questions[0]!.difficulty as number) = 5;

        expect(() => validateInterviewKit(invalid)).toThrow();
    });

    it("rejects invalid company URL", () => {
        const invalid = structuredClone(validKit);

        invalid.source.company_url = "not-a-url";

        expect(() => validateInterviewKit(invalid)).toThrow();
    });

    it("rejects negative minutes", () => {
        const invalid = structuredClone(validKit);

        invalid.schedule.days[0]!.minutes = -10;

        expect(() => validateInterviewKit(invalid)).toThrow();
    });
});

describe("validateKitRelationships", () => {
    it("accepts valid relationships", () => {
        const kit = validateInterviewKit(validKit);

        expect(validateKitRelationships(kit)).toEqual([]);
    });

    it("detects unknown requirement references", () => {
        const invalid = structuredClone(validKit);

        invalid.questions[0]!.requirement_ids = ["r999"];

        const kit = validateInterviewKit(invalid);
        const errors = validateKitRelationships(kit);

        expect(errors).toContain(
            "Question q1 references unknown requirement r999.",
        );
    });

    it("detects unknown schedule question", () => {
        const invalid = structuredClone(validKit);

        invalid.schedule.days[0]!.question_ids = ["q999"];

        const kit = validateInterviewKit(invalid);
        const errors = validateKitRelationships(kit);

        expect(errors).toContain(
            "Schedule day 1 references unknown question q999.",
        );
    });

    it("detects uncovered must-have requirements", () => {
        const invalid = structuredClone(validKit);

        invalid.questions[0]!.requirement_ids = [];

        const kit = validateInterviewKit(invalid);
        const errors = validateKitRelationships(kit);

        expect(errors).toContain(
            "Must-have requirement r1 is not covered by any question.",
        );
    });

    it("detects incorrect schedule length", () => {
        const invalid = structuredClone(validKit);

        invalid.schedule.days_available = 5;

        const kit = validateInterviewKit(invalid);
        const errors = validateKitRelationships(kit);

        expect(errors).toContain(
            "Schedule contains 1 days but days_available is 5.",
        );
    });
});
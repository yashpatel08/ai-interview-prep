import { describe, expect, it } from "vitest";

import {
    addQuestionToSchedule,
    removeQuestionFromSchedule,
    updateQuestionScheduleMinutes,
} from "../apps/api/src/services/kits/scheduleQuestionService.js";

import type {
    InterviewKit,
    Question,
} from "@ai-interview-prep/core";

const question1: Question = {
    id: "q1",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "Explain React rendering.",
    answer_outline: "Discuss reconciliation.",
    difficulty: 1,
};

const question2: Question = {
    id: "q2",
    requirement_ids: ["r2"],
    category: "system_design",
    prompt: "Design a scalable API.",
    answer_outline: "Discuss scalability.",
    difficulty: 3,
};

function createKit(): InterviewKit {
    return {
        source: {
            company: "Example",
            company_url: "https://example.com",
            role: "Engineer",
            location: "",
            jd_chars: 100,
            jd: "Example job description",
            researched_at:
                "2026-01-01T00:00:00.000Z",
            pages_used: [],
        },
        company_brief: {
            summary: "Example",
            what_they_do: "Example",
            sources: [],
        },
        role: {
            title: "Engineer",
            seniority: "Mid",
            responsibilities: [],
            requirements: [
                {
                    id: "r1",
                    text: "React",
                    kind: "technical",
                    priority: "must",
                },
                {
                    id: "r2",
                    text: "Architecture",
                    kind: "technical",
                    priority: "must",
                },
            ],
        },
        questions: [question1],
        flashcards: [],
        schedule: {
            days_available: 2,
            days: [
                {
                    day: 1,
                    focus: "Technical interview practice",
                    question_ids: ["q1"],
                    minutes: 10,
                },
                {
                    day: 2,
                    focus: "Review and practice",
                    question_ids: [],
                    minutes: 0,
                },
            ],
        },
        coverage: {
            uncovered_requirement_ids: ["r2"],
            passes: 1,
        },
    };
}

describe("schedule question service", () => {
    it("adds a question to the least-loaded day", () => {
        const kit = createKit();

        const schedule =
            addQuestionToSchedule(
                kit,
                question2,
            );

        expect(
            schedule.days[0]?.question_ids,
        ).toEqual(["q1"]);

        expect(
            schedule.days[1]?.question_ids,
        ).toEqual(["q2"]);

        expect(
            schedule.days[1]?.minutes,
        ).toBe(20);
    });

    it("updates minutes when question difficulty changes", () => {
        const kit = createKit();

        const schedule =
            updateQuestionScheduleMinutes(
                kit,
                "q1",
                1,
                3,
            );

        expect(
            schedule.days[0]?.minutes,
        ).toBe(20);

        expect(
            schedule.days[0]?.question_ids,
        ).toEqual(["q1"]);

        expect(
            schedule.days[1]?.minutes,
        ).toBe(0);
    });

    it("removes a question and its allocated minutes", () => {
        const kit = createKit();

        kit.questions.push(question2);
        kit.schedule.days[1]!.question_ids = [
            "q2",
        ];
        kit.schedule.days[1]!.minutes = 20;

        const schedule =
            removeQuestionFromSchedule(
                kit,
                "q2",
            );

        expect(
            schedule.days[1]?.question_ids,
        ).toEqual([]);

        expect(
            schedule.days[1]?.minutes,
        ).toBe(0);
    });
});
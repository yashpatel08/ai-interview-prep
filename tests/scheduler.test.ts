import { describe, expect, it } from "vitest";

import {
    buildSchedule,
    type Question,
    type Requirement,
} from "../packages/core/src/index.js";

const requirements: Requirement[] = [
    {
        id: "r1",
        text: "5+ years with React",
        kind: "technical",
        priority: "must",
    },
    {
        id: "r2",
        text: "Experience with Node.js",
        kind: "technical",
        priority: "must",
    },
    {
        id: "r3",
        text: "Experience mentoring developers",
        kind: "soft_skill",
        priority: "nice",
    },
];

const questions: Question[] = [
    {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain React rendering.",
        answer_outline: "Discuss reconciliation and rendering.",
        difficulty: 3,
    },
    {
        id: "q2",
        requirement_ids: ["r2"],
        category: "technical",
        prompt: "How does Node.js handle concurrency?",
        answer_outline: "Discuss event loop and async I/O.",
        difficulty: 3,
    },
    {
        id: "q3",
        requirement_ids: ["r3"],
        category: "behavioral",
        prompt: "Tell me about mentoring a developer.",
        answer_outline: "Use a concrete mentoring example.",
        difficulty: 1,
    },
    {
        id: "q4",
        requirement_ids: ["r1", "r2"],
        category: "system_design",
        prompt: "Design a scalable React and Node application.",
        answer_outline: "Discuss frontend, API, caching and scaling.",
        difficulty: 3,
    },
];

describe("buildSchedule", () => {
    it("creates exactly one day for a one-day schedule", () => {
        const schedule = buildSchedule({
            daysAvailable: 1,
            questions,
            requirements,
        });

        expect(schedule).toHaveLength(1);
        expect(schedule[0]?.day).toBe(1);
    });

    it("creates exactly five days", () => {
        const schedule = buildSchedule({
            daysAvailable: 5,
            questions,
            requirements,
        });

        expect(schedule).toHaveLength(5);

        expect(schedule.map((day) => day.day)).toEqual([
            1,
            2,
            3,
            4,
            5,
        ]);
    });

    it("creates exactly sixty days", () => {
        const schedule = buildSchedule({
            daysAvailable: 60,
            questions,
            requirements,
        });

        expect(schedule).toHaveLength(60);

        expect(schedule.map((day) => day.day)).toEqual(
            Array.from({ length: 60 }, (_, index) => index + 1),
        );
    });

    it("includes every question exactly once", () => {
        const schedule = buildSchedule({
            daysAvailable: 5,
            questions,
            requirements,
        });

        const scheduledQuestionIds = schedule.flatMap(
            (day) => day.question_ids,
        );

        expect(scheduledQuestionIds).toHaveLength(questions.length);

        expect(new Set(scheduledQuestionIds).size).toBe(
            questions.length,
        );

        expect(scheduledQuestionIds.sort()).toEqual(
            questions.map((question) => question.id).sort(),
        );
    });

    it("uses integer minutes", () => {
        const schedule = buildSchedule({
            daysAvailable: 5,
            questions,
            requirements,
        });

        for (const day of schedule) {
            expect(Number.isInteger(day.minutes)).toBe(true);
        }
    });

    it("puts high-value questions first", () => {
        const schedule = buildSchedule({
            daysAvailable: 2,
            questions,
            requirements,
        });

        const firstDay = schedule[0]!;

        expect(firstDay.question_ids).toContain("q4");
    });

    it("handles no questions", () => {
        const schedule = buildSchedule({
            daysAvailable: 3,
            questions: [],
            requirements,
        });

        expect(schedule).toHaveLength(3);

        for (const day of schedule) {
            expect(day.question_ids).toEqual([]);
            expect(day.minutes).toBe(0);
        }
    });

    it("rejects invalid day counts", () => {
        expect(() =>
            buildSchedule({
                daysAvailable: 0,
                questions,
                requirements,
            }),
        ).toThrow();

        expect(() =>
            buildSchedule({
                daysAvailable: -1,
                questions,
                requirements,
            }),
        ).toThrow();

        expect(() =>
            buildSchedule({
                daysAvailable: 1.5,
                questions,
                requirements,
            }),
        ).toThrow();
    });

    it("covers every must-have requirement through scheduled questions", () => {
        const schedule = buildSchedule({
            daysAvailable: 3,
            questions,
            requirements,
        });

        const scheduledIds = new Set(
            schedule.flatMap((day) => day.question_ids),
        );

        const scheduledQuestions = questions.filter((question) =>
            scheduledIds.has(question.id),
        );

        for (const requirement of requirements) {
            if (requirement.priority !== "must") {
                continue;
            }

            const covered = scheduledQuestions.some((question) =>
                question.requirement_ids.includes(requirement.id),
            );

            expect(covered).toBe(true);
        }
    });
});
import { describe, expect, it } from "vitest";

import {
    findUncoveredRequirements,
} from "@ai-interview-prep/core";

describe("coverage", () => {
    it("detects an uncovered must requirement", () => {
        const requirements = [
            {
                id: "r1",
                text: "5+ years with React",
                kind: "technical" as const,
                priority: "must" as const,
            },
            {
                id: "r2",
                text: "Good communication",
                kind: "soft_skill" as const,
                priority: "nice" as const,
            },
        ];

        const questions = [
            {
                id: "q1",
                requirement_ids: ["r2"],
                category: "behavioral" as const,
                prompt: "Tell me about communication.",
                answer_outline: "Use STAR.",
                difficulty: 1 as const,
            },
        ];

        expect(
            findUncoveredRequirements(
                requirements,
                questions,
            ),
        ).toEqual(["r1"]);
    });

    it("returns no uncovered requirements when every must requirement is covered", () => {
        const requirements = [
            {
                id: "r1",
                text: "React experience",
                kind: "technical" as const,
                priority: "must" as const,
            },
        ];

        const questions = [
            {
                id: "q1",
                requirement_ids: ["r1"],
                category: "technical" as const,
                prompt: "Explain React.",
                answer_outline: "Discuss components.",
                difficulty: 2 as const,
            },
        ];

        expect(
            findUncoveredRequirements(
                requirements,
                questions,
            ),
        ).toEqual([]);
    });

    it("does not require nice-to-have requirements", () => {
        const requirements = [
            {
                id: "r1",
                text: "React experience",
                kind: "technical" as const,
                priority: "must" as const,
            },
            {
                id: "r2",
                text: "GraphQL experience",
                kind: "technical" as const,
                priority: "nice" as const,
            },
        ];

        const questions = [
            {
                id: "q1",
                requirement_ids: ["r1"],
                category: "technical" as const,
                prompt: "Explain React.",
                answer_outline: "Components.",
                difficulty: 2 as const,
            },
        ];

        expect(
            findUncoveredRequirements(
                requirements,
                questions,
            ),
        ).toEqual([]);
    });
});
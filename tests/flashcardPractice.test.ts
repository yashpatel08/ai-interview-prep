import { describe, expect, it } from "vitest";
import {
    prioritizeFlashcards,
    type FlashcardPracticeProgress,
} from "@ai-interview-prep/core";
import type { Flashcard } from "@ai-interview-prep/core";

const flashcards: Flashcard[] = [
    {
        id: "f1",
        front: "React?",
        back: "A UI library",
        requirement_ids: ["r1"],
    },
    {
        id: "f2",
        front: "Node.js?",
        back: "JavaScript runtime",
        requirement_ids: ["r2"],
    },
    {
        id: "f3",
        front: "MongoDB?",
        back: "Document database",
        requirement_ids: ["r3"],
    },
];

describe("prioritizeFlashcards", () => {
    it("puts uncovered cards first", () => {
        const progress: FlashcardPracticeProgress[] = [
            {
                flashcardId: "f1",
                confidence: 3,
                covered: true,
                reviewCount: 2,
                lastReviewedAt: "2026-09-08T10:00:00.000Z",
            },
            {
                flashcardId: "f2",
                confidence: 1,
                covered: false,
                reviewCount: 0,
                lastReviewedAt: null,
            },
            {
                flashcardId: "f3",
                confidence: 2,
                covered: true,
                reviewCount: 1,
                lastReviewedAt: "2026-09-07T10:00:00.000Z",
            },
        ];

        const result = prioritizeFlashcards(
            flashcards,
            progress,
        );

        expect(result.map(card => card.id)).toEqual([
            "f2",
            "f3",
            "f1",
        ]);
    });

    it("treats missing progress as uncovered", () => {
        const progress: FlashcardPracticeProgress[] = [];

        const result = prioritizeFlashcards(
            flashcards,
            progress,
        );

        expect(result.map(card => card.id)).toEqual([
            "f1",
            "f2",
            "f3",
        ]);
    });

    it("prioritizes lower confidence", () => {
        const progress: FlashcardPracticeProgress[] = [
            {
                flashcardId: "f1",
                confidence: 3,
                covered: true,
                reviewCount: 1,
                lastReviewedAt: "2026-09-08T10:00:00.000Z",
            },
            {
                flashcardId: "f2",
                confidence: 1,
                covered: true,
                reviewCount: 1,
                lastReviewedAt: "2026-09-08T10:00:00.000Z",
            },
            {
                flashcardId: "f3",
                confidence: 2,
                covered: true,
                reviewCount: 1,
                lastReviewedAt: "2026-09-08T10:00:00.000Z",
            },
        ];

        const result = prioritizeFlashcards(
            flashcards,
            progress,
        );

        expect(result.map(card => card.id)).toEqual([
            "f2",
            "f3",
            "f1",
        ]);
    });
});
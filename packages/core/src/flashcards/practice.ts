import type { Flashcard } from "../types/kit.js";

export interface FlashcardPracticeProgress {
    flashcardId: string;
    confidence: 1 | 2 | 3 | null;
    covered: boolean;
    reviewCount: number;
    lastReviewedAt: string | null;
}

function confidenceScore(
    confidence: FlashcardPracticeProgress["confidence"],
): number {
    if (confidence === null) return 0;
    return confidence;
}

function reviewTimestamp(
    value: string | null,
): number {
    if (!value) return 0;

    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Practice order:
 * 1. Uncovered cards first
 * 2. Lowest confidence first
 * 3. Least recently reviewed first
 * 4. Stable flashcard ID as final tie-breaker
 */
export function prioritizeFlashcards(
    flashcards: Flashcard[],
    progress: FlashcardPracticeProgress[],
): Flashcard[] {
    const progressMap = new Map(
        progress.map(item => [item.flashcardId, item]),
    );

    return [...flashcards].sort((a, b) => {
        const aProgress = progressMap.get(a.id);
        const bProgress = progressMap.get(b.id);

        const aCovered = aProgress?.covered ?? false;
        const bCovered = bProgress?.covered ?? false;

        if (aCovered !== bCovered) {
            return aCovered ? 1 : -1;
        }

        const confidenceDifference =
            confidenceScore(aProgress?.confidence ?? null) -
            confidenceScore(bProgress?.confidence ?? null);

        if (confidenceDifference !== 0) {
            return confidenceDifference;
        }

        const reviewDifference =
            reviewTimestamp(aProgress?.lastReviewedAt ?? null) -
            reviewTimestamp(bProgress?.lastReviewedAt ?? null);

        if (reviewDifference !== 0) {
            return reviewDifference;
        }

        return a.id.localeCompare(b.id);
    });
}
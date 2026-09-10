import mongoose from "mongoose";

import { KitModel } from "../../models/Kit.js";
import { FlashcardProgressModel } from "../../models/FlashcardProgress.js";
import type { Flashcard } from "@ai-interview-prep/core";

export type FlashcardConfidence = 1 | 2 | 3;

function validateKitId(kitId: string) {
    if (!kitId || !mongoose.isValidObjectId(kitId)) {
        throw new Error("INVALID_KIT_ID");
    }
}

function validateConfidence(
    confidence: number,
): asserts confidence is FlashcardConfidence {
    if (
        confidence !== 1 &&
        confidence !== 2 &&
        confidence !== 3
    ) {
        throw new Error("INVALID_CONFIDENCE");
    }
}

async function findOwnedKit(
    userId: string,
    kitId: string,
) {
    validateKitId(kitId);

    return KitModel.findOne({
        _id: kitId,
        userId,
    });
}

function findFlashcard(
    kit: NonNullable<Awaited<ReturnType<typeof findOwnedKit>>>,
    flashcardId: string,
): Flashcard | undefined {
    const flashcards =
        kit.kit?.flashcards as Flashcard[] | undefined;

    return flashcards?.find(
        (flashcard: Flashcard) =>
            flashcard.id === flashcardId,
    );
}

export async function getFlashcardProgress(
    userId: string,
    kitId: string,
) {
    const kit = await findOwnedKit(userId, kitId);

    if (!kit) {
        return null;
    }

    if (!kit.kit) {
        return [];
    }

    const progress = await FlashcardProgressModel.find({
        userId,
        kitId,
    })
        .sort({
            covered: 1,
            confidence: 1,
            lastReviewedAt: 1,
            flashcardId: 1,
        })
        .lean();

    return progress;
}

export async function reviewFlashcard(
    userId: string,
    kitId: string,
    flashcardId: string,
    confidence: number,
) {
    validateKitId(kitId);
    validateConfidence(confidence);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit) {
        return null;
    }

    if (!kit.kit) {
        return null;
    }

    const flashcard = findFlashcard(
        kit,
        flashcardId,
    );

    if (!flashcard) {
        throw new Error("FLASHCARD_NOT_FOUND");
    }

    const now = new Date();

    const progress =
        await FlashcardProgressModel.findOneAndUpdate(
            {
                userId,
                kitId,
                flashcardId,
            },
            {
                $set: {
                    confidence,
                    covered: true,
                    lastReviewedAt: now,
                },
                $inc: {
                    reviewCount: 1,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            },
        ).lean();

    return progress;
}

export async function resetFlashcardProgress(
    userId: string,
    kitId: string,
    flashcardId: string,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit) {
        return null;
    }

    if (!kit.kit) {
        return null;
    }

    const flashcard = findFlashcard(
        kit,
        flashcardId,
    );

    if (!flashcard) {
        throw new Error("FLASHCARD_NOT_FOUND");
    }

    await FlashcardProgressModel.deleteOne({
        userId,
        kitId,
        flashcardId,
    });

    return {
        flashcardId,
        confidence: null,
        covered: false,
        reviewCount: 0,
        lastReviewedAt: null,
    };
}

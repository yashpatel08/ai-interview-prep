import mongoose from "mongoose";
import type { Flashcard } from "@ai-interview-prep/core";

import { createStableId } from "../generation/ids.js";
import { KitModel } from "../../models/Kit.js";
import { FlashcardProgressModel } from "../../models/FlashcardProgress.js";

function validateKitId(kitId: string) {
    if (
        !kitId ||
        !mongoose.isValidObjectId(kitId)
    ) {
        throw new Error("INVALID_KIT_ID");
    }
}

function validateRequirementIds(
    kit: {
        kit?: {
            role?: {
                requirements?: Array<{
                    id: string;
                }>;
            };
        } | null;
    },
    requirementIds: string[],
) {
    const validIds = new Set(
        kit.kit?.role?.requirements?.map(
            (requirement) => requirement.id,
        ) ?? [],
    );

    const invalidIds =
        requirementIds.filter(
            (id) => !validIds.has(id),
        );

    if (invalidIds.length > 0) {
        throw new Error(
            "INVALID_REQUIREMENT_ID",
        );
    }
}

export async function addFlashcard(
    userId: string,
    kitId: string,
    input: Omit<Flashcard, "id">,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    validateRequirementIds(
        kit,
        input.requirement_ids,
    );

    const flashcard: Flashcard = {
        id: createStableId("f"),
        ...input,
        state: "edited",
    };

    kit.kit.flashcards.push(
        flashcard,
    );

    kit.markModified(
        "kit.flashcards",
    );

    await kit.save();

    return kit;
}

export async function updateFlashcard(
    userId: string,
    kitId: string,
    flashcardId: string,
    update: Partial<Omit<Flashcard, "id">>,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    const flashcard =
        kit.kit.flashcards.find(
            (item: Flashcard) =>
                item.id === flashcardId,
        );

    if (!flashcard) {
        return null;
    }

    if (update.requirement_ids) {
        validateRequirementIds(
            kit,
            update.requirement_ids,
        );
    }

    Object.assign(
        flashcard,
        update,
    );

    // Keep pinned flashcards protected
    // from regeneration.
    if (flashcard.state !== "pinned") {
        flashcard.state = "edited";
    }

    kit.markModified(
        "kit.flashcards",
    );

    await kit.save();

    return kit;
}

export async function deleteFlashcard(
    userId: string,
    kitId: string,
    flashcardId: string,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    const originalLength =
        kit.kit.flashcards.length;

    kit.kit.flashcards =
        kit.kit.flashcards.filter(
            (flashcard: Flashcard) =>
                flashcard.id !==
                flashcardId,
        );

    if (
        kit.kit.flashcards.length ===
        originalLength
    ) {
        return null;
    }

    // Remove associated practice progress.
    await FlashcardProgressModel.deleteOne({
        userId,
        kitId,
        flashcardId,
    });

    kit.markModified(
        "kit.flashcards",
    );

    await kit.save();

    return kit;
}
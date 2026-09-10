import mongoose from "mongoose";
import type {
    Flashcard,
    Question,
} from "@ai-interview-prep/core";

import { KitModel } from "../../models/Kit.js";

type PinState = "pinned" | "edited";

function validateKitId(kitId: string) {
    if (
        !kitId ||
        !mongoose.isValidObjectId(kitId)
    ) {
        throw new Error("INVALID_KIT_ID");
    }
}

export async function setQuestionPinned(
    userId: string,
    kitId: string,
    questionId: string,
    pinned: boolean,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    const question = kit.kit.questions.find(
        (item: Question) => item.id === questionId,
    );

    if (!question) {
        throw new Error("QUESTION_NOT_FOUND");
    }

    if (pinned) {
        // Only remember the previous state when
        // transitioning into pinned.
        if (question.state !== "pinned") {
            question.state_before_pin =
                question.state === "edited"
                    ? "edited"
                    : "generated";
        }

        question.state = "pinned";
    } else {
        // Restore the state that existed before pinning.
        question.state =
            question.state_before_pin ?? "generated";

        delete question.state_before_pin;
    }

    kit.markModified("kit.questions");

    await kit.save();

    return question;
}

export async function setFlashcardPinned(
    userId: string,
    kitId: string,
    flashcardId: string,
    pinned: boolean,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    const flashcard = kit.kit.flashcards.find(
        (item: Flashcard) => item.id === flashcardId,
    );

    if (!flashcard) {
        throw new Error("FLASHCARD_NOT_FOUND");
    }

    if (pinned) {
        if (flashcard.state !== "pinned") {
            flashcard.state_before_pin =
                flashcard.state === "edited"
                    ? "edited"
                    : "generated";
        }

        flashcard.state = "pinned";
    } else {
        flashcard.state =
            flashcard.state_before_pin ?? "generated";

        delete flashcard.state_before_pin;
    }

    kit.markModified("kit.flashcards");

    await kit.save();

    return flashcard;
}
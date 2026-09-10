import mongoose from "mongoose";
import type { Question } from "@ai-interview-prep/core";

import { createStableId } from "../generation/ids.js";
import { KitModel } from "../../models/Kit.js";
import {
    addQuestionToSchedule,
    removeQuestionFromSchedule,
    updateQuestionScheduleMinutes,
} from "./scheduleQuestionService.js";

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
    const requirements =
        kit.kit?.role?.requirements ?? [];

    const validIds = new Set(
        requirements.map(
            (requirement) => requirement.id,
        ),
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

export async function addQuestion(
    userId: string,
    kitId: string,
    input: Omit<Question, "id">,
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

    const question: Question = {
        id: createStableId("q"),
        ...input,
        state: "edited",
    };

    kit.kit.questions.push(question);

    kit.kit.schedule =
        addQuestionToSchedule(
            kit.kit,
            question,
        );

    kit.markModified("kit.questions");
    kit.markModified("kit.schedule");

    await kit.save();

    return kit;
}

export async function updateQuestion(
    userId: string,
    kitId: string,
    questionId: string,
    update: Record<string, unknown>,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    const question =
        kit.kit.questions.find(
            (item: Question) =>
                item.id === questionId,
        );

    if (!question) {
        return null;
    }

    if (
        Array.isArray(
            update.requirement_ids,
        )
    ) {
        validateRequirementIds(
            kit,
            update.requirement_ids as string[],
        );
    }

    const oldDifficulty =
        question.difficulty;

    // Remember whether the question was pinned
    // before applying the manual edit.
    const wasPinned =
        question.state === "pinned";

    Object.assign(question, update);

    // Manual edits protect the question from
    // regeneration.
    //
    // If it was already pinned, keep it pinned.
    // Otherwise, a manual edit makes it "edited".
    if (wasPinned) {
        question.state = "pinned";
    } else {
        question.state = "edited";
    }

    if (
        typeof update.difficulty === "number" &&
        (update.difficulty === 1 ||
            update.difficulty === 2 ||
            update.difficulty === 3)
    ) {
        kit.kit.schedule =
            updateQuestionScheduleMinutes(
                kit.kit,
                questionId,
                oldDifficulty,
                update.difficulty,
            );

        kit.markModified("kit.schedule");
    }

    kit.markModified("kit.questions");

    await kit.save();

    return kit;
}

export async function deleteQuestion(
    userId: string,
    kitId: string,
    questionId: string,
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    const question =
        kit.kit.questions.find(
            (item: Question) =>
                item.id === questionId,
        );

    if (!question) {
        return null;
    }

    // Remove it from the schedule first,
    // while the question still exists in kit.questions.
    kit.kit.schedule =
        removeQuestionFromSchedule(
            kit.kit,
            questionId,
        );

    // Then remove the question itself.
    kit.kit.questions =
        kit.kit.questions.filter(
            (item: Question) =>
                item.id !== questionId,
        );

    kit.markModified("kit.questions");
    kit.markModified("kit.schedule");

    await kit.save();

    return kit;
}

export async function reorderQuestions(
    userId: string,
    kitId: string,
    questionIds: string[],
) {
    validateKitId(kitId);

    const kit = await KitModel.findOne({
        _id: kitId,
        userId,
    });

    if (!kit?.kit) {
        return null;
    }

    const questions =
        kit.kit.questions;

    if (
        questionIds.length !==
        questions.length
    ) {
        throw new Error(
            "QUESTION_ORDER_MISMATCH",
        );
    }

    const existingIds = new Set(
        questions.map(
            (question: Question) =>
                question.id,
        ),
    );

    const submittedIds =
        new Set(questionIds);

    if (
        existingIds.size !==
        submittedIds.size ||
        questionIds.some(
            (id) => !existingIds.has(id),
        )
    ) {
        throw new Error(
            "INVALID_QUESTION_ORDER",
        );
    }

    const questionMap = new Map(
        questions.map(
            (question: Question) => [
                question.id,
                question,
            ],
        ),
    );

    kit.kit.questions =
        questionIds.map((id) => {
            const question =
                questionMap.get(id);

            if (!question) {
                throw new Error(
                    "INVALID_QUESTION_ORDER",
                );
            }

            return question;
        });

    kit.markModified("kit.questions");

    await kit.save();

    return kit;
}
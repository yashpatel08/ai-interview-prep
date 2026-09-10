import mongoose from "mongoose";
import type {
    InterviewKit,
    QuestionCategory,
} from "@ai-interview-prep/core";

import { KitModel } from "../../models/Kit.js";
import {
    regenerateSection,
} from "./regenerationService.js";

function validateKitId(kitId: string) {
    if (
        !kitId ||
        !mongoose.isValidObjectId(kitId)
    ) {
        throw new Error("INVALID_KIT_ID");
    }
}

export async function regenerateKitSection(
    userId: string,
    kitId: string,
    section:
        | "company_brief"
        | "questions"
        | "flashcards",
    category?: QuestionCategory,
) {
    validateKitId(kitId);

    const kitDocument =
        await KitModel.findOne({
            _id: kitId,
            userId,
        });

    if (!kitDocument?.kit) {
        return null;
    }

    const currentKit =
        kitDocument.kit as InterviewKit;

    const nextKit =
        await regenerateSection({
            kit: currentKit,
            section,
            category,
        });

    kitDocument.kit = nextKit;

    kitDocument.markModified("kit");

    await kitDocument.save();

    return kitDocument;
}
import mongoose from "mongoose";
import { KitModel } from "../../models/Kit.js";

interface CreateKitInput {
    userId: string;
    sourceHash: string;

    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        jd: string;
    };

    status: "generating" | "ready" | "failed";

    generation: {
        status:
            | "queued"
            | "researching_company"
            | "extracting_requirements"
            | "generating_company_brief"
            | "generating_questions"
            | "checking_coverage"
            | "closing_gaps"
            | "generating_flashcards"
            | "building_schedule"
            | "validating"
            | "complete"
            | "failed";

        progress: number;

        error: {
            code: string;
            message: string;
        } | null;

        startedAt: Date | null;
        completedAt: Date | null;
    };

    kit: unknown | null;
}

function validateKitId(kitId: string) {
    if (!kitId || !mongoose.isValidObjectId(kitId)) {
        throw new Error("INVALID_KIT_ID");
    }
}

export async function findKitById(
    userId: string,
    kitId: string,
) {
    validateKitId(kitId);

    return KitModel.findOne({
        _id: kitId,
        userId,
    });
}

export async function findExistingKit(
    userId: string,
    sourceHash: string,
) {
    return KitModel.findOne({
        userId,
        sourceHash,
    }).sort({
        createdAt: -1,
    });
}

export async function createKit({
    userId,
    sourceHash,
    source,
    status,
    generation,
    kit,
}: CreateKitInput) {
    return KitModel.create({
        userId,
        sourceHash,
        source,
        status,
        generation,
        kit,
    });
}

export async function listUserKits(
    userId: string,
) {
    return KitModel.find({
        userId,
    })
        .sort({
            createdAt: -1,
        })
        .select({
            _id: 1,
            status: 1,
            source: 1,
            generation: 1,
            createdAt: 1,
            updatedAt: 1,
        })
        .lean();
}

export async function updateKit(
    userId: string,
    kitId: string,
    update: Record<string, unknown>,
) {
    validateKitId(kitId);

    return KitModel.findOneAndUpdate(
        {
            _id: kitId,
            userId,
        },
        {
            $set: update,
        },
        {
            returnDocument: "after",
            runValidators: true,
        },
    );
}

export async function deleteKit(
    userId: string,
    kitId: string,
) {
    validateKitId(kitId);

    return KitModel.findOneAndDelete({
        _id: kitId,
        userId,
    });
}
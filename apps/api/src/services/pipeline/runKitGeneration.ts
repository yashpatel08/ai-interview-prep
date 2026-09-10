import { generateKit } from "./generateKit.js";
import {
    findKitById,
    updateKit,
} from "../kits/kitService.js";
import type { PipelineProgress } from "./types.js";

interface RunKitGenerationInput {
    userId: string;
    kitId: string;
    jd: string;
    companyUrl: string;
    daysAvailable: number;
}

export async function runKitGeneration({
    userId,
    kitId,
    jd,
    companyUrl,
    daysAvailable,
}: RunKitGenerationInput): Promise<void> {
    try {
        await updateKit(userId, kitId, {
            "generation.status": "queued",
            "generation.progress": 0,
            "generation.error": null,
            "generation.startedAt": new Date(),
        });

        const result = await generateKit(
            {
                jd,
                companyUrl,
                daysAvailable,
            },
            async ({
                stage,
                progress,
            }: PipelineProgress) => {
                await updateKit(userId, kitId, {
                    "generation.status": stage,
                    "generation.progress": progress,
                });
            },
        );

        await updateKit(userId, kitId, {
            status: "ready",
            kit: result.kit,
            "generation.status": "complete",
            "generation.progress": 100,
            "generation.error": null,
            "generation.completedAt": new Date(),
        });
    } catch (error) {
        console.error(
            `Kit generation failed for ${kitId}:`,
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Kit generation failed.";

        await updateKit(userId, kitId, {
            status: "failed",
            "generation.status": "failed",
            "generation.progress": 100,
            "generation.error": {
                code: "GENERATION_FAILED",
                message,
            },
            "generation.completedAt": new Date(),
        });
    }
}
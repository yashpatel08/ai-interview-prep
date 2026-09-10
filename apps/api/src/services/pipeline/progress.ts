import type {
    PipelineProgress,
    ProgressCallback,
} from "./types.js";

export async function reportProgress(
    callback: ProgressCallback | undefined,
    stage: PipelineProgress["stage"],
    progress: number,
): Promise<void> {
    if (!callback) {
        return;
    }

    await callback({
        stage,
        progress: Math.max(0, Math.min(100, Math.round(progress))),
    });
}
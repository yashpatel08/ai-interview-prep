import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

import {
    safeValidateInterviewKit,
    type InterviewKit,
} from "@ai-interview-prep/core";

dotenv.config({
    path: path.resolve(
        process.cwd(),
        "apps/api/.env",
    ),
});

interface EvaluationCase {
    id: string;
    jd: string;
    company_url: string;
    days: number;
}

interface EvaluationOutput {
    version: "1.0";
    generated_at: string;
    kits: Array<{
        id: string;
        status: "ok" | "failed";
        kit: InterviewKit | null;
        error: {
            code: string;
            message: string;
        } | null;
    }>;
}

function getArg(name: string): string {
    const index = process.argv.indexOf(name);

    if (index === -1) {
        throw new Error(
            `Missing required argument: ${name}`,
        );
    }

    const value = process.argv[index + 1];

    if (!value) {
        throw new Error(
            `Missing value for argument: ${name}`,
        );
    }

    return value;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function validateInputCase(
    value: unknown,
    index: number,
): EvaluationCase {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        throw new Error(
            `Case ${index + 1} must be an object.`,
        );
    }

    const item =
        value as Record<string, unknown>;

    if (
        typeof item.id !== "string" ||
        !item.id.trim()
    ) {
        throw new Error(
            `Case ${index + 1}: id is required.`,
        );
    }

    if (
        typeof item.jd !== "string" ||
        !item.jd.trim()
    ) {
        throw new Error(
            `Case ${item.id}: jd is required.`,
        );
    }

    if (
        typeof item.company_url !== "string" ||
        !item.company_url.trim()
    ) {
        throw new Error(
            `Case ${item.id}: company_url is required.`,
        );
    }

    if (
        typeof item.days !== "number" ||
        !Number.isInteger(item.days) ||
        item.days < 1 ||
        item.days > 60
    ) {
        throw new Error(
            `Case ${item.id}: days must be an integer from 1 to 60.`,
        );
    }

    return {
        id: item.id,
        jd: item.jd,
        company_url: item.company_url,
        days: item.days,
    };
}

async function readCases(
    inputPath: string,
): Promise<EvaluationCase[]> {
    const absolutePath =
        path.resolve(inputPath);

    const raw =
        await fs.readFile(
            absolutePath,
            "utf8",
        );

    const parsed: unknown =
        JSON.parse(raw);

    if (!Array.isArray(parsed)) {
        throw new Error(
            "Input file must contain a JSON array.",
        );
    }

    return parsed.map(
        validateInputCase,
    );
}

function createFailure(
    id: string,
    error: unknown,
) {
    if (error instanceof Error) {
        return {
            id,
            status: "failed" as const,
            kit: null,
            error: {
                code:
                    error.message ||
                    "GENERATION_FAILED",
                message:
                    error.message ||
                    "Kit generation failed.",
            },
        };
    }

    return {
        id,
        status: "failed" as const,
        kit: null,
        error: {
            code: "GENERATION_FAILED",
            message: "Kit generation failed.",
        },
    };
}

async function runCase(
    item: EvaluationCase,
    generateKit: typeof import(
        "../apps/api/src/services/pipeline/generateKit.js"
    ).generateKit,
) {
    console.log(
        `\n[${item.id}] Generating kit...`,
    );

    try {
        const result =
            await generateKit({
                jd: item.jd,
                companyUrl:
                    item.company_url,
                daysAvailable:
                    item.days,
            });

        const kit = result.kit;

        const validation =
            safeValidateInterviewKit(
                kit,
            );

        if (!validation.success) {
            console.error(
                `[${item.id}] Validation errors:`,
                JSON.stringify(
                    validation.error,
                    null,
                    2,
                ),
            );

            throw new Error(
                "FINAL_KIT_VALIDATION_FAILED",
            );
        }

        if (
            kit.schedule.days_available !==
            item.days
        ) {
            throw new Error(
                "SCHEDULE_DAYS_MISMATCH",
            );
        }

        console.log(
            `[${item.id}] OK`,
        );

        return {
            id: item.id,
            status: "ok" as const,
            kit,
            error: null,
        };
    } catch (error) {
        console.error(
            `[${item.id}] FAILED`,
            error,
        );

        return createFailure(
            item.id,
            error,
        );
    }
}

async function main() {
    const inputPath =
        getArg("--input");

    const outputPath =
        getArg("--output");

    const cases =
        await readCases(inputPath);

    const { generateKit } =
        await import(
            "../apps/api/src/services/pipeline/generateKit.js"
        );

    if (cases.length === 0) {
        throw new Error(
            "Input file contains no cases.",
        );
    }

    const ids = new Set<string>();

    for (const item of cases) {
        if (ids.has(item.id)) {
            throw new Error(
                `Duplicate case id: ${item.id}`,
            );
        }

        ids.add(item.id);
    }

    const results: EvaluationOutput["kits"] =
        [];

    for (const [index, item] of cases.entries()) {
        if (index > 0) {
            console.log(
                "\nWaiting 25 seconds before the next case to respect LLM rate limits...\n",
            );

            await sleep(25_000);
        }

        const result =
            await runCase(
                item,
                generateKit,
            );

        results.push(result);
    }

    const output: EvaluationOutput = {
        version: "1.0",
        generated_at:
            new Date().toISOString(),
        kits: results,
    };

    const absoluteOutput =
        path.resolve(outputPath);

    await fs.mkdir(
        path.dirname(absoluteOutput),
        {
            recursive: true,
        },
    );

    await fs.writeFile(
        absoluteOutput,
        JSON.stringify(
            output,
            null,
            2,
        ),
        "utf8",
    );

    const successful =
        results.filter(
            (item) =>
                item.status === "ok",
        ).length;

    const failed =
        results.length - successful;

    console.log(
        `\nEvaluation complete: ${successful} ok, ${failed} failed.`,
    );

    console.log(
        `Output: ${absoluteOutput}`,
    );
}

main().catch((error) => {
    console.error(
        "\nEvaluation failed:",
        error,
    );

    process.exitCode = 1;
});
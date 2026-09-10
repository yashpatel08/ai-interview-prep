import {
    buildSchedule,
    findUncoveredRequirements,
    validateInterviewKit,
    validateKitRelationships,
} from "@ai-interview-prep/core";

import {
    researchCompany,
    buildResearchContext,
    generateCompanyBrief,
    extractRequirements,
    extractRole,
} from "../research/index.js";

import {
    generateQuestions,
    generateFlashcards,
} from "../generation/index.js";

import {
    reportProgress,
} from "./progress.js";

import type {
    GenerateKitInput,
    GenerateKitResult,
    ProgressCallback,
} from "./types.js";

function inferCompanyName(
    companyUrl: string,
): string {
    try {
        const hostname = new URL(companyUrl).hostname;

        return hostname
            .replace(/^www\./, "")
            .split(".")[0]
            ?.replace(/[-_]/g, " ")
            .replace(/\b\w/g, (character) =>
                character.toUpperCase(),
            ) ?? "Company";
    } catch {
        return "Company";
    }
}

export async function generateKit(
    input: GenerateKitInput,
    onProgress?: ProgressCallback,
): Promise<GenerateKitResult> {
    const {
        jd,
        companyUrl,
        daysAvailable,
    } = input;

    const companyName = inferCompanyName(companyUrl);

    await reportProgress(
        onProgress,
        "researching_company",
        5,
    );

    const research = await researchCompany(companyUrl);

    const researchContext =
        buildResearchContext(research);

    await reportProgress(
        onProgress,
        "extracting_requirements",
        15,
    );

    const requirements = await extractRequirements(
        jd,
    );

    if (requirements.length === 0) {
        throw new Error(
            "Could not extract any requirements from the job description.",
        );
    }

    const role = await extractRole(jd);

    await reportProgress(onProgress, "generating_company_brief", 25);

    const researchText = researchContext.pages
        .map((page) => `${page.title}\n${page.text}`)
        .join("\n\n");

    const companyBrief = await generateCompanyBrief(researchText);

    await reportProgress(
        onProgress,
        "generating_questions",
        35,
    );

    const categories = [
        "technical",
        "behavioral",
        "system_design",
        "company_fit",
    ] as const;

    let questions = [];

    for (const category of categories) {
        const generated = await generateQuestions({
            category,
            requirements,
            roleTitle: role.title,
            companyName,
            context: researchText,
        });

        questions.push(...generated);
    }

    await reportProgress(
        onProgress,
        "checking_coverage",
        60,
    );

    let uncovered =
        findUncoveredRequirements(
            requirements,
            questions,
        );

    let passes = 1;

    /*
     * Coverage closure:
     *
     * Maximum of three passes.
     *
     * Each pass generates questions only for
     * currently uncovered MUST requirements.
     */
    while (
        uncovered.length > 0 &&
        passes < 3
    ) {
        await reportProgress(
            onProgress,
            "closing_gaps",
            60 + passes * 5,
        );

        const uncoveredRequirements =
            requirements.filter((requirement) =>
                uncovered.includes(requirement.id),
            );

        const targeted = await generateQuestions({
            category: "technical",
            requirements,
            targetRequirementIds: uncovered,
            roleTitle: role.title,
            companyName,
            context: `
Generate targeted questions specifically to close coverage gaps
for these requirements.

${uncoveredRequirements
                    .map((requirement) => requirement.text)
                    .join("\n")}
    `.trim(),
        });

        questions.push(...targeted);

        passes += 1;

        uncovered =
            findUncoveredRequirements(
                requirements,
                questions,
            );
    }

    await reportProgress(
        onProgress,
        "generating_flashcards",
        75,
    );

    const flashcards =
        await generateFlashcards(
            requirements,
            role.title,
        );

    await reportProgress(
        onProgress,
        "building_schedule",
        85,
    );

    const schedule = buildSchedule({
        daysAvailable,
        questions,
        requirements,
    });

    await reportProgress(
        onProgress,
        "validating",
        95,
    );

    const kit = validateInterviewKit({
        source: {
            company: companyName,
            company_url: companyUrl,
            role: role.title,
            location: "",
            jd_chars: jd.length,
            jd: jd,
            researched_at:
                new Date().toISOString(),
            pages_used: research.pagesUsed,
        },

        company_brief: {
            summary: companyBrief.summary,
            what_they_do:
                companyBrief.what_they_do,
            sources:
                researchContext.sourceUrls,
        },

        role: {
            title: role.title,
            seniority: role.seniority,
            responsibilities:
                role.responsibilities,
            requirements,
        },

        questions,

        flashcards,

        schedule: {
            days_available: daysAvailable,
            days: schedule,
        },

        coverage: {
            uncovered_requirement_ids:
                uncovered,
            passes,
        },
    });

    validateKitRelationships(kit);

    await reportProgress(
        onProgress,
        "complete",
        100,
    );

    return {
        kit,
    };
}
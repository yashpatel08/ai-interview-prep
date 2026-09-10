import type {
    InterviewKit,
    Requirement,
    Question,
    Flashcard,
} from "@ai-interview-prep/core";

import type {
    CompanyResearch,
    ResearchContext,
} from "../research/index.js";

export interface GenerateKitInput {
    jd: string;
    companyUrl: string;
    daysAvailable: number;
}

export interface PipelineProgress {
    stage:
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
}

export interface PipelineContext {
    input: GenerateKitInput;

    research?: CompanyResearch;
    researchContext?: ResearchContext;

    requirements?: Requirement[];
    questions?: Question[];
    flashcards?: Flashcard[];

    companyBrief?: {
        summary: string;
        what_they_do: string;
    };

    role?: {
        title: string;
        seniority: string;
        responsibilities: string[];
    };
}

export type ProgressCallback = (
    progress: PipelineProgress,
) => Promise<void> | void;

export interface GenerateKitResult {
    kit: InterviewKit;
}
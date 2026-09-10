export type RequirementKind =
    | "technical"
    | "experience"
    | "education"
    | "responsibility"
    | "soft_skill"
    | "company"
    | "other";

export type RequirementPriority = "must" | "nice";

export type QuestionCategory =
    | "technical"
    | "behavioral"
    | "system_design"
    | "company_fit";

export interface Requirement {
    id: string;
    text: string;
    kind: RequirementKind;
    priority: RequirementPriority;
}

export type ContentState =
    | "generated"
    | "edited"
    | "pinned";

export type PreviousContentState =
    | "generated"
    | "edited";


export interface Question {
    id: string;
    requirement_ids: string[];
    category: QuestionCategory;
    prompt: string;
    answer_outline: string;
    difficulty: 1 | 2 | 3;
    state?: ContentState;
    state_before_pin?: PreviousContentState;
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    requirement_ids: string[];
    state?: ContentState;
    state_before_pin?: PreviousContentState;

}

export interface ScheduleDay {
    day: number;
    focus: string;
    question_ids: string[];
    minutes: number;
}

export interface InterviewKit {
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
        jd: string;
        researched_at: string;
        pages_used: string[];
    };

    company_brief: {
        summary: string;
        what_they_do: string;
        sources: string[];
    };

    role: {
        title: string;
        seniority: string;
        responsibilities: string[];
        requirements: Requirement[];
    };

    questions: Question[];

    flashcards: Flashcard[];

    schedule: {
        days_available: number;
        days: ScheduleDay[];
    };

    coverage: {
        uncovered_requirement_ids: string[];
        passes: number;
    };
}

import type {
    InterviewKit,
    QuestionCategory,
} from "@ai-interview-prep/core";

export function mergeRegeneratedQuestions(
    original: InterviewKit,
    regeneratedQuestions: InterviewKit["questions"],
    category?: QuestionCategory,
): InterviewKit["questions"] {
    const categoriesToRegenerate =
        category
            ? new Set<QuestionCategory>([
                category,
            ])
            : new Set<QuestionCategory>([
                "technical",
                "behavioral",
                "system_design",
                "company_fit",
            ]);

    const preservedQuestions =
        original.questions.filter(
            (question) =>
                categoriesToRegenerate.has(
                    question.category,
                ) &&
                (
                    question.state === "edited" ||
                    question.state === "pinned"
                ),
        );

    const untouchedQuestions =
        original.questions.filter(
            (question) =>
                !categoriesToRegenerate.has(
                    question.category,
                ),
        );

    return [
        ...untouchedQuestions,
        ...preservedQuestions,
        ...regeneratedQuestions,
    ];
}
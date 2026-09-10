import type {
    Question,
    Requirement,
    ScheduleDay,
} from "../types/kit.js";

interface BuildScheduleInput {
    daysAvailable: number;
    questions: Question[];
    requirements: Requirement[];
}

interface ScoredQuestion {
    question: Question;
    score: number;
}

function calculateQuestionScore(
    question: Question,
    requirementsById: Map<string, Requirement>,
): number {
    const requirementScore = question.requirement_ids.reduce(
        (total, requirementId) => {
            const requirement = requirementsById.get(requirementId);

            if (!requirement) {
                return total;
            }

            return total + (requirement.priority === "must" ? 10 : 3);
        },
        0,
    );

    const difficultyScore = question.difficulty * 3;
    const coverageScore = question.requirement_ids.length * 2;

    return requirementScore + difficultyScore + coverageScore;
}

function getQuestionMinutes(
    difficulty: Question["difficulty"],
): number {
    if (difficulty === 1) {
        return 10;
    }

    if (difficulty === 2) {
        return 15;
    }

    return 20;
}

function getQuestionFocus(
    questions: Question[],
    requirementsById: Map<string, Requirement>,
): string {
    const categories = new Set(
        questions.map((question) => question.category),
    );

    const categoryNames: Record<string, string> = {
        technical: "Technical preparation",
        behavioral: "Behavioral preparation",
        system_design: "System design",
        company_fit: "Company and role fit",
    };

    const categoryFocus = [...categories]
        .map(
            (category) =>
                categoryNames[category] ?? category,
        )
        .join(" + ");

    const mustHaveCount = questions.filter((question) =>
        question.requirement_ids.some(
            (requirementId) =>
                requirementsById.get(requirementId)?.priority ===
                "must",
        ),
    ).length;

    if (mustHaveCount > 0) {
        return `${categoryFocus} — ${mustHaveCount} priority questions`;
    }

    return categoryFocus || "Interview preparation";
}

function createReviewDay(day: number): ScheduleDay {
    return {
        day,
        focus: "Review covered requirements",
        question_ids: [],
        minutes: 15,
    };
}

export function buildSchedule({
    daysAvailable,
    questions,
    requirements,
}: BuildScheduleInput): ScheduleDay[] {
    if (
        !Number.isInteger(daysAvailable) ||
        daysAvailable < 1
    ) {
        throw new Error(
            "daysAvailable must be a positive integer",
        );
    }

    const requirementsById = new Map(
        requirements.map((requirement) => [
            requirement.id,
            requirement,
        ]),
    );

    const days: ScheduleDay[] = Array.from(
        { length: daysAvailable },
        (_, index) => createReviewDay(index + 1),
    );

    if (questions.length === 0) {
        days[days.length - 1] = {
            day: daysAvailable,
            focus: "Final review and interview preparation",
            question_ids: [],
            minutes: 20,
        };

        return days;
    }

    const scoredQuestions: ScoredQuestion[] = questions
        .map((question) => ({
            question,
            score: calculateQuestionScore(
                question,
                requirementsById,
            ),
        }))
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return a.question.id.localeCompare(
                b.question.id,
            );
        });

    /*
     * Place questions on the earliest available days first.
     *
     * This is intentionally sequential rather than round-robin.
     * High-priority/high-difficulty questions therefore appear
     * earlier in the plan.
     *
     * If there are more questions than days, multiple questions
     * are naturally grouped onto a day.
     */
    const questionCount = scoredQuestions.length;

    scoredQuestions.forEach(
        ({ question }, index) => {
            const dayIndex = Math.min(
                Math.floor(
                    (index * daysAvailable) /
                        questionCount,
                ),
                daysAvailable - 1,
            );

            const day = days[dayIndex]!;

            day.question_ids.push(question.id);
            day.minutes += getQuestionMinutes(
                question.difficulty,
            );
        },
    );

    /*
     * Give every day a useful focus.
     */
    for (const day of days) {
        if (day.question_ids.length === 0) {
            continue;
        }

        const dayQuestions = day.question_ids
            .map((id) =>
                questions.find(
                    (question) => question.id === id,
                ),
            )
            .filter(
                (
                    question,
                ): question is Question =>
                    question !== undefined,
            );

        day.focus = getQuestionFocus(
            dayQuestions,
            requirementsById,
        );
    }

    /*
     * Final day should always be a useful review day when
     * it has no assigned questions.
     */
    const finalDay = days[days.length - 1]!;

    if (finalDay.question_ids.length === 0) {
        finalDay.focus =
            "Final review and interview preparation";
        finalDay.minutes = 20;
    }

    return days;
}
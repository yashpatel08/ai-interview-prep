import type {
    InterviewKit,
    Question,
    ScheduleDay,
} from "@ai-interview-prep/core";

const MINUTES_BY_DIFFICULTY: Record<
    Question["difficulty"],
    number
> = {
    1: 10,
    2: 15,
    3: 20,
};

export function updateQuestionScheduleMinutes(
    kit: InterviewKit,
    questionId: string,
    oldDifficulty: Question["difficulty"],
    newDifficulty: Question["difficulty"],
): InterviewKit["schedule"] {
    if (oldDifficulty === newDifficulty) {
        return kit.schedule;
    }

    const oldMinutes =
        MINUTES_BY_DIFFICULTY[oldDifficulty];

    const newMinutes =
        MINUTES_BY_DIFFICULTY[newDifficulty];

    const difference =
        newMinutes - oldMinutes;

    const days = kit.schedule.days.map(
        (day) => {
            if (
                !day.question_ids.includes(
                    questionId,
                )
            ) {
                return {
                    ...day,
                    question_ids: [
                        ...day.question_ids,
                    ],
                };
            }

            return {
                ...day,
                question_ids: [
                    ...day.question_ids,
                ],
                minutes: Math.max(
                    0,
                    day.minutes + difference,
                ),
            };
        },
    );

    return {
        days_available:
            kit.schedule.days_available,
        days,
    };
}

export function addQuestionToSchedule(
    kit: InterviewKit,
    question: Question,
): InterviewKit["schedule"] {
    const days = kit.schedule.days.map(
        (day) => ({
            ...day,
            question_ids: [
                ...day.question_ids,
            ],
        }),
    );

    if (days.length === 0) {
        throw new Error(
            "SCHEDULE_HAS_NO_DAYS",
        );
    }

    // Find the least-loaded day.
    // Ties automatically keep the earliest day.
    let targetIndex = 0;

    for (let index = 1; index < days.length; index += 1) {
        const currentDay = days[index];
        const targetDay = days[targetIndex];

        if (!currentDay || !targetDay) {
            continue;
        }

        if (
            currentDay.minutes <
            targetDay.minutes
        ) {
            targetIndex = index;
        }
    }

    const targetDay = days[targetIndex];

    if (!targetDay) {
        throw new Error(
            "SCHEDULE_HAS_NO_DAYS",
        );
    }

    targetDay.question_ids.push(
        question.id,
    );

    targetDay.minutes +=
        MINUTES_BY_DIFFICULTY[
            question.difficulty
        ];

    targetDay.focus = buildDayFocus(
        targetDay,
        kit.questions,
        question,
    );

    return {
        days_available:
            kit.schedule.days_available,
        days,
    };
}

export function removeQuestionFromSchedule(
    kit: InterviewKit,
    questionId: string,
): InterviewKit["schedule"] {
    const question = kit.questions.find(
        (item) => item.id === questionId,
    );

    if (!question) {
        return kit.schedule;
    }

    const minutes =
        MINUTES_BY_DIFFICULTY[
            question.difficulty
        ];

    const days = kit.schedule.days.map(
        (day) => {
            const containsQuestion =
                day.question_ids.includes(
                    questionId,
                );

            if (!containsQuestion) {
                return {
                    ...day,
                    question_ids: [
                        ...day.question_ids,
                    ],
                };
            }

            return {
                ...day,
                question_ids:
                    day.question_ids.filter(
                        (id) =>
                            id !== questionId,
                    ),
                minutes: Math.max(
                    0,
                    day.minutes - minutes,
                ),
                focus: buildDayFocus(
                    {
                        ...day,
                        question_ids:
                            day.question_ids.filter(
                                (id) =>
                                    id !==
                                    questionId,
                            ),
                    },
                    kit.questions.filter(
                        (item) =>
                            item.id !==
                            questionId,
                    ),
                ),
            };
        },
    );

    return {
        days_available:
            kit.schedule.days_available,
        days,
    };
}

function buildDayFocus(
    day: ScheduleDay,
    questions: Question[],
    addedQuestion?: Question,
): string {
    const ids = new Set(
        day.question_ids,
    );

    if (addedQuestion) {
        ids.add(addedQuestion.id);
    }

    const categories = questions
        .filter((question) =>
            ids.has(question.id),
        )
        .map(
            (question) =>
                question.category,
        );

    if (categories.length === 0) {
        return "Review and practice";
    }

    const counts = new Map<
        string,
        number
    >();

    for (const category of categories) {
        counts.set(
            category,
            (counts.get(category) ?? 0) + 1,
        );
    }

    const category = [
        ...counts.entries(),
    ].sort(
        (a, b) =>
            b[1] - a[1] ||
            a[0].localeCompare(b[0]),
    )[0]?.[0];

    switch (category) {
        case "technical":
            return "Technical interview practice";

        case "behavioral":
            return "Behavioral interview practice";

        case "system_design":
            return "System design practice";

        case "company_fit":
            return "Company and role fit";

        default:
            return "Review and practice";
    }
}
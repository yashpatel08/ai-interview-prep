import type {
    Question,
    Requirement,
} from "../src/types/kit.js";

export function findUncoveredRequirements(
    requirements: Requirement[],
    questions: Question[],
): string[] {
    const covered = new Set(
        questions.flatMap((question) => question.requirement_ids),
    );

    return requirements
        .filter((requirement) => requirement.priority === "must")
        .filter((requirement) => !covered.has(requirement.id))
        .map((requirement) => requirement.id);
}
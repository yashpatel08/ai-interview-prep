import { z } from "zod";

import type {
    Flashcard,
    Requirement,
} from "@ai-interview-prep/core";

import { llmClient } from "../llm/llmClient.js";
import { createStableId } from "./ids.js";

const FlashcardOutputSchema = z.object({
    flashcards: z.array(
        z.object({
            requirement_indexes: z.array(
                z.number().int().nonnegative(),
            ),
            front: z.string().min(1),
            back: z.string().min(1),
        }),
    ),
});

export async function generateFlashcards(
    requirements: Requirement[],
    roleTitle: string,
): Promise<Flashcard[]> {
    const requirementText = requirements
        .map(
            (requirement, index) =>
                `[${index}] ${requirement.text}`,
        )
        .join("\n");

    const result = await llmClient.generateJson(
        {
            systemPrompt: `
Create concise interview-preparation flashcards.

Rules:
- Base flashcards on the supplied requirements.
- Do not invent requirements.
- Front should be a useful recall question or concept.
- Back should contain the key answer points.
- Return JSON only.
      `.trim(),

            userPrompt: `
Role:
${roleTitle}

Requirements:

<requirements>
${requirementText}
</requirements>

Return:

{
  "flashcards": [
    {
      "requirement_indexes": [0],
      "front": "",
      "back": ""
    }
  ]
}
      `.trim(),

            temperature: 0.2,
            maxTokens: 3_000,
        },
        (value) => FlashcardOutputSchema.parse(value),
    );

    return result.flashcards.map((flashcard) => ({
        id: createStableId("f"),
        front: flashcard.front,
        back: flashcard.back,
        requirement_ids: flashcard.requirement_indexes
            .filter(
                (index) => requirements[index] !== undefined,
            )
            .map((index) => requirements[index]!.id),
    }));
}
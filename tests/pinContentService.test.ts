import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
} from "vitest";

import type {
    InterviewKit,
    Question,
    Flashcard,
} from "@ai-interview-prep/core";

const mockSave = vi.fn();

const mockQuestion: Question = {
    id: "q1",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "Original question",
    answer_outline: "Original answer",
    difficulty: 2,
    state: "generated",
};

const mockFlashcard: Flashcard = {
    id: "f1",
    front: "Original front",
    back: "Original back",
    requirement_ids: ["r1"],
    state: "generated",
};

const mockKit: {
    kit: Pick<
        InterviewKit,
        "questions" | "flashcards"
    >;
    markModified: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
} = {
    kit: {
        questions: [mockQuestion],
        flashcards: [mockFlashcard],
    },
    markModified: vi.fn(),
    save: mockSave,
};

vi.mock(
    "../apps/api/src/models/Kit.js",
    () => ({
        KitModel: {
            findOne: vi.fn(() => mockKit),
        },
    }),
);

import {
    setQuestionPinned,
    setFlashcardPinned,
} from "../apps/api/src/services/kits/pinContentService.js";

describe("pin content service", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockQuestion.state = "generated";
        delete mockQuestion.state_before_pin;

        mockFlashcard.state = "generated";
        delete mockFlashcard.state_before_pin;

        mockSave.mockResolvedValue(
            mockKit,
        );
    });

    it("pins and unpins a generated question", async () => {
        const pinned =
            await setQuestionPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                true,
            );

        expect(pinned?.state).toBe(
            "pinned",
        );

        expect(
            pinned?.state_before_pin,
        ).toBe("generated");

        const unpinned =
            await setQuestionPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                false,
            );

        expect(unpinned?.state).toBe(
            "generated",
        );

        expect(
            unpinned?.state_before_pin,
        ).toBeUndefined();

        expect(
            mockSave,
        ).toHaveBeenCalled();
    });

    it("pins and unpins an edited question", async () => {
        mockQuestion.state = "edited";

        const pinned =
            await setQuestionPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                true,
            );

        expect(pinned?.state).toBe(
            "pinned",
        );

        expect(
            pinned?.state_before_pin,
        ).toBe("edited");

        const unpinned =
            await setQuestionPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "q1",
                false,
            );

        expect(unpinned?.state).toBe(
            "edited",
        );

        expect(
            unpinned?.state_before_pin,
        ).toBeUndefined();
    });

    it("pins and unpins a generated flashcard", async () => {
        const pinned =
            await setFlashcardPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "f1",
                true,
            );

        expect(pinned?.state).toBe(
            "pinned",
        );

        expect(
            pinned?.state_before_pin,
        ).toBe("generated");

        const unpinned =
            await setFlashcardPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "f1",
                false,
            );

        expect(unpinned?.state).toBe(
            "generated",
        );

        expect(
            unpinned?.state_before_pin,
        ).toBeUndefined();

        expect(
            mockSave,
        ).toHaveBeenCalled();
    });

    it("pins and unpins an edited flashcard", async () => {
        mockFlashcard.state = "edited";

        const pinned =
            await setFlashcardPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "f1",
                true,
            );

        expect(pinned?.state).toBe(
            "pinned",
        );

        expect(
            pinned?.state_before_pin,
        ).toBe("edited");

        const unpinned =
            await setFlashcardPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "f1",
                false,
            );

        expect(unpinned?.state).toBe(
            "edited",
        );

        expect(
            unpinned?.state_before_pin,
        ).toBeUndefined();
    });

    it("rejects an invalid question id", async () => {
        await expect(
            setQuestionPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "does-not-exist",
                true,
            ),
        ).rejects.toThrow(
            "QUESTION_NOT_FOUND",
        );
    });

    it("rejects an invalid flashcard id", async () => {
        await expect(
            setFlashcardPinned(
                "507f1f77bcf86cd799439011",
                "507f1f77bcf86cd799439012",
                "does-not-exist",
                true,
            ),
        ).rejects.toThrow(
            "FLASHCARD_NOT_FOUND",
        );
    });
});

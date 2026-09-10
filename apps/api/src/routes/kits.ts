import { Router } from "express";
import z from "zod";
import { requireAuth, getAuthenticatedUserId } from "../middleware/auth.js";
import {
    createKitSchema,
    updateKitSchema,
    updateQuestionSchema,
    updateFlashcardSchema,
    createFlashcardSchema,
    createQuestionSchema,
    reviewFlashcardSchema,
    pinContentSchema
} from "../validators/kit.js";
import {
    runKitGeneration,
} from "../services/pipeline/index.js";
import {
    createKit,
    deleteKit,
    findExistingKit,
    findKitById,
    listUserKits,
    updateKit,
} from "../services/kits/kitService.js";
import {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
} from "../services/kits/questionService.js";
import { createSourceHash } from "../services/kits/sourceHash.js";
import { addFlashcard, deleteFlashcard, updateFlashcard } from "../services/kits/flashcardService.js";
import {
    getFlashcardProgress,
    reviewFlashcard,
    resetFlashcardProgress,
} from "../services/kits/flashcardProgressService.js";
import {
    setQuestionPinned,
    setFlashcardPinned,
} from "../services/kits/pinContentService.js";
import {
    regenerateSectionSchema,
} from "../validators/regeneration.js";

import {
    regenerateKitSection,
} from "../services/kits/regenerateKitService.js";
const router = Router();

function handleQuestionServiceError(
    error: unknown,
    res: any,
): boolean {
    if (
        error instanceof Error &&
        error.message === "INVALID_KIT_ID"
    ) {
        res.status(400).json({
            error: {
                code: "INVALID_KIT_ID",
                message:
                    "Invalid interview kit ID.",
            },
        });

        return true;
    }

    if (
        error instanceof Error &&
        error.message ===
        "INVALID_REQUIREMENT_ID"
    ) {
        res.status(400).json({
            error: {
                code: "INVALID_REQUIREMENT_ID",
                message:
                    "One or more requirements are invalid.",
            },
        });

        return true;
    }

    if (
        error instanceof Error &&
        error.message ===
        "QUESTION_ORDER_MISMATCH"
    ) {
        res.status(400).json({
            error: {
                code: "QUESTION_ORDER_MISMATCH",
                message:
                    "The submitted question order does not match the kit.",
            },
        });

        return true;
    }

    if (
        error instanceof Error &&
        error.message ===
        "INVALID_QUESTION_ORDER"
    ) {
        res.status(400).json({
            error: {
                code: "INVALID_QUESTION_ORDER",
                message:
                    "The submitted question order is invalid.",
            },
        });

        return true;
    }

    return false;
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
    try {
        const kits = await listUserKits(
            getAuthenticatedUserId(req),
        );

        res.json({
            kits,
        });
    } catch (error) {
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const parsed = createKitSchema.safeParse(req.body);
        const userId = getAuthenticatedUserId(req);

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code: "INVALID_REQUEST",
                    message:
                        "A valid job description and company URL are required.",
                    details: parsed.error.flatten(),
                },
            });

            return;
        }

        const { jd, company_url } = parsed.data;

        /*
         * Validate days separately for now.
         *
         * We will eventually expose this directly
         * in the frontend form.
         */
        const daysAvailable = Number(
            req.body.days_available ?? 5,
        );

        if (
            !Number.isInteger(daysAvailable) ||
            daysAvailable < 1 ||
            daysAvailable > 60
        ) {
            res.status(400).json({
                error: {
                    code: "INVALID_DAYS",
                    message:
                        "days_available must be an integer between 1 and 60.",
                },
            });

            return;
        }

        const sourceHash = createSourceHash(
            jd,
            company_url,
        );

        const existingKit = await findExistingKit(userId, sourceHash);

        if (existingKit) {
            // Reuse an active or successfully generated kit.
            if (
                existingKit.status === "generating" ||
                existingKit.status === "ready"
            ) {
                res.status(200).json({
                    id: existingKit._id.toString(),
                    status: existingKit.status,
                    reused: true,
                });
                return;
            }

            // A failed kit should be retried instead of being reused.
            await updateKit(
                userId,
                existingKit._id.toString(),
                {
                    status: "generating",
                    kit: null,
                    "generation.status": "queued",
                    "generation.progress": 0,
                    "generation.error": null,
                    "generation.startedAt": null,
                    "generation.completedAt": null,
                },
            );

            void runKitGeneration({
                userId,
                kitId: existingKit._id.toString(),
                jd,
                companyUrl: company_url,
                daysAvailable,
            });

            res.status(202).json({
                id: existingKit._id.toString(),
                status: "generating",
                reused: false,
                retried: true,
            });

            return;
        }

        const kit = await createKit({
            userId,
            sourceHash,
            source: {
                company: "",
                company_url,
                role: "",
                location: "",
                jd_chars: jd.length,
                jd,
            },
            status: "generating",
            generation: {
                status: "queued",
                progress: 0,
                error: null,
                startedAt: null,
                completedAt: null,
            },
            kit: null,
        });

        /*
         * Start the long-running pipeline without making
         * the HTTP request wait for the LLM/crawler work.
         */
        void runKitGeneration({
            userId,
            kitId: kit._id.toString(),
            jd,
            companyUrl: company_url,
            daysAvailable,
        });

        res.status(202).json({
            id: kit._id.toString(),
            status: "generating",
            reused: false,
        });
    } catch (error) {
        next(error);
    }
});

router.post(
    "/:kitId/regenerate",
    requireAuth,
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const kitId = req.params.kitId;

            if (
                typeof kitId !== "string" ||
                !kitId
            ) {
                return res.status(400).json({
                    error: "INVALID_KIT_ID",
                });
            }

            const input =
                regenerateSectionSchema.parse(
                    req.body,
                );

            const kit =
                await regenerateKitSection(
                    userId,
                    kitId,
                    input.section,
                    input.category,
                );

            if (!kit) {
                return res.status(404).json({
                    error: "KIT_NOT_FOUND",
                });
            }

            return res.json({
                kit,
            });
        } catch (error) {
            if (
                error instanceof Error &&
                error.message ===
                    "INVALID_KIT_ID"
            ) {
                return res.status(400).json({
                    error: "INVALID_KIT_ID",
                });
            }

            return next(error);
        }
    },
);

router.patch(
    "/:kitId/questions/:questionId/pin",
    async (req, res, next) => {
        try {
            const parsed =
                pinContentSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                return res.status(400).json({
                    error: "INVALID_INPUT",
                    details:
                        parsed.error.flatten(),
                });
            }

            const userId =
                getAuthenticatedUserId(req);

            const question =
                await setQuestionPinned(
                    userId,
                    req.params.kitId,
                    req.params.questionId,
                    parsed.data.pinned,
                );

            if (question === null) {
                return res.status(404).json({
                    error: "KIT_NOT_FOUND",
                });
            }

            return res.json({
                question,
            });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            if (
                error instanceof Error &&
                error.message ===
                    "QUESTION_NOT_FOUND"
            ) {
                return res.status(404).json({
                    error: "QUESTION_NOT_FOUND",
                });
            }

            return next(error);
        }
    },
);

router.patch(
    "/:kitId/questions/:questionId",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const parsed =
                updateQuestionSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                res.status(400).json({
                    error: {
                        code: "INVALID_INPUT",
                        message:
                            "Invalid question update.",
                        details:
                            parsed.error.flatten(),
                    },
                });
                return;
            }

            const kit = await updateQuestion(
                userId,
                req.params.kitId,
                req.params.questionId,
                parsed.data,
            );

            if (!kit) {
                res.status(404).json({
                    error: {
                        code: "QUESTION_NOT_FOUND",
                        message:
                            "Question not found.",
                    },
                });
                return;
            }

            res.json({ kit });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            next(error);
        }
    },
);


router.patch(
    "/:kitId/questions/reorder",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const schema = z.object({
                question_ids: z
                    .array(z.string().min(1))
                    .min(1),
            });

            const parsed =
                schema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({
                    error: {
                        code: "INVALID_INPUT",
                        message:
                            "Invalid question order.",
                    },
                });
                return;
            }

            const kit =
                await reorderQuestions(
                    userId,
                    req.params.kitId,
                    parsed.data.question_ids,
                );

            if (!kit) {
                res.status(404).json({
                    error: {
                        code: "KIT_NOT_FOUND",
                        message:
                            "Interview kit not found.",
                    },
                });
                return;
            }

            res.json({ kit });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            next(error);
        }
    },
);

router.delete(
    "/:kitId/questions/:questionId",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const kit = await deleteQuestion(
                userId,
                req.params.kitId,
                req.params.questionId,
            );

            if (!kit) {
                res.status(404).json({
                    error: {
                        code: "QUESTION_NOT_FOUND",
                        message:
                            "Question not found.",
                    },
                });
                return;
            }

            res.json({ kit });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            next(error);
        }
    },
);

router.post(
    "/:kitId/questions",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const parsed =
                createQuestionSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                res.status(400).json({
                    error: {
                        code: "INVALID_INPUT",
                        message:
                            "Invalid question.",
                        details:
                            parsed.error.flatten(),
                    },
                });
                return;
            }

            const kit = await addQuestion(
                userId,
                req.params.kitId,
                parsed.data,
            );

            if (!kit) {
                res.status(404).json({
                    error: {
                        code: "KIT_NOT_FOUND",
                        message:
                            "Interview kit not found.",
                    },
                });
                return;
            }

            res.status(201).json({ kit });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            next(error);
        }
    },
);

router.post(
    "/:kitId/flashcards",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const parsed =
                createFlashcardSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                res.status(400).json({
                    error: {
                        code: "INVALID_INPUT",
                        message:
                            "Invalid flashcard.",
                        details:
                            parsed.error.flatten(),
                    },
                });
                return;
            }

            const kit =
                await addFlashcard(
                    userId,
                    req.params.kitId,
                    parsed.data,
                );

            if (!kit) {
                res.status(404).json({
                    error: {
                        code: "KIT_NOT_FOUND",
                        message:
                            "Interview kit not found.",
                    },
                });
                return;
            }

            res.status(201).json({ kit });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            next(error);
        }
    },
);

router.patch(
    "/:kitId/flashcards/:flashcardId/pin",
    async (req, res, next) => {
        try {
            const parsed =
                pinContentSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                return res.status(400).json({
                    error: "INVALID_INPUT",
                    details:
                        parsed.error.flatten(),
                });
            }

            const userId =
                getAuthenticatedUserId(req);

            const flashcard =
                await setFlashcardPinned(
                    userId,
                    req.params.kitId,
                    req.params.flashcardId,
                    parsed.data.pinned,
                );

            if (flashcard === null) {
                return res.status(404).json({
                    error: "KIT_NOT_FOUND",
                });
            }

            return res.json({
                flashcard,
            });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            if (
                error instanceof Error &&
                error.message ===
                    "FLASHCARD_NOT_FOUND"
            ) {
                return res.status(404).json({
                    error: "FLASHCARD_NOT_FOUND",
                });
            }

            return next(error);
        }
    },
);

router.patch(
    "/:kitId/flashcards/:flashcardId",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const parsed =
                updateFlashcardSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                res.status(400).json({
                    error: {
                        code: "INVALID_INPUT",
                        message:
                            "Invalid flashcard update.",
                        details:
                            parsed.error.flatten(),
                    },
                });
                return;
            }

            const kit =
                await updateFlashcard(
                    userId,
                    req.params.kitId,
                    req.params.flashcardId,
                    parsed.data,
                );

            if (!kit) {
                res.status(404).json({
                    error: {
                        code: "FLASHCARD_NOT_FOUND",
                        message:
                            "Flashcard not found.",
                    },
                });
                return;
            }

            res.json({ kit });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            next(error);
        }
    },
);

router.delete(
    "/:kitId/flashcards/:flashcardId",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const kit =
                await deleteFlashcard(
                    userId,
                    req.params.kitId,
                    req.params.flashcardId,
                );

            if (!kit) {
                res.status(404).json({
                    error: {
                        code: "FLASHCARD_NOT_FOUND",
                        message:
                            "Flashcard not found.",
                    },
                });
                return;
            }

            res.json({ kit });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            next(error);
        }
    },
);

router.get(
    "/:kitId/flashcards/progress",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const progress =
                await getFlashcardProgress(
                    userId,
                    req.params.kitId,
                );

            if (progress === null) {
                return res.status(404).json({
                    error: "KIT_NOT_FOUND",
                });
            }

            return res.json({
                progress,
            });
        } catch (error) {
            return next(error);
        }
    },
);

router.post(
    "/:kitId/flashcards/:flashcardId/review",
    async (req, res, next) => {
        try {
            const parsed =
                reviewFlashcardSchema.safeParse(
                    req.body,
                );

            if (!parsed.success) {
                return res.status(400).json({
                    error: "INVALID_INPUT",
                    details: parsed.error.flatten(),
                });
            }

            const userId =
                getAuthenticatedUserId(req);

            const progress =
                await reviewFlashcard(
                    userId,
                    req.params.kitId,
                    req.params.flashcardId,
                    parsed.data.confidence,
                );

            if (progress === null) {
                return res.status(404).json({
                    error: "KIT_NOT_FOUND",
                });
            }

            return res.json({
                progress,
            });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            if (
                error instanceof Error &&
                error.message ===
                "FLASHCARD_NOT_FOUND"
            ) {
                return res.status(404).json({
                    error: "FLASHCARD_NOT_FOUND",
                });
            }

            return next(error);
        }
    },
);

router.post(
    "/:kitId/flashcards/:flashcardId/reset-progress",
    async (req, res, next) => {
        try {
            const userId =
                getAuthenticatedUserId(req);

            const result =
                await resetFlashcardProgress(
                    userId,
                    req.params.kitId,
                    req.params.flashcardId,
                );

            if (result === null) {
                return res.status(404).json({
                    error: "KIT_NOT_FOUND",
                });
            }

            return res.json({
                progress: result,
            });
        } catch (error) {
            if (
                handleQuestionServiceError(
                    error,
                    res,
                )
            ) {
                return;
            }

            if (
                error instanceof Error &&
                error.message ===
                "FLASHCARD_NOT_FOUND"
            ) {
                return res.status(404).json({
                    error: "FLASHCARD_NOT_FOUND",
                });
            }

            return next(error);
        }
    },
);

router.get("/:kitId", async (req, res, next) => {
    try {
        const kit = await findKitById(
            getAuthenticatedUserId(req),
            req.params.kitId,
        );

        if (!kit) {
            res.status(404).json({
                error: {
                    code: "KIT_NOT_FOUND",
                    message: "Interview kit not found.",
                },
            });

            return;
        }

        res.json({
            kit: {
                id: kit._id.toString(),
                status: kit.status,
                source: kit.source,
                generation: kit.generation,
                kit: kit.kit,
                createdAt: kit.createdAt,
                updatedAt: kit.updatedAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.patch("/:kitId", async (req, res, next) => {
    try {
        const parsed = updateKitSchema.safeParse(
            req.body,
        );

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code: "INVALID_INPUT",
                    message: "Invalid kit update.",
                },
            });

            return;
        }

        const kit = await updateKit(
            getAuthenticatedUserId(req),
            req.params.kitId,
            parsed.data,
        );

        if (!kit) {
            res.status(404).json({
                error: {
                    code: "KIT_NOT_FOUND",
                    message: "Interview kit not found.",
                },
            });

            return;
        }

        res.json({
            kit,
        });
    } catch (error) {
        next(error);
    }
});

router.delete("/:kitId", async (req, res, next) => {
    try {
        const deleted = await deleteKit(
            getAuthenticatedUserId(req),
            req.params.kitId,
        );

        if (!deleted) {
            res.status(404).json({
                error: {
                    code: "KIT_NOT_FOUND",
                    message: "Interview kit not found.",
                },
            });

            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export const kitsRouter = router;
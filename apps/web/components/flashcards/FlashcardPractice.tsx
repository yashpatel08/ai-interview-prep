"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from "lucide-react";

import type {
    Flashcard,
    FlashcardPracticeProgress,
} from "@ai-interview-prep/core";

import { apiFetch } from "@/lib/api";

interface FlashcardPracticeProps {
    kitId: string;
    flashcards: Flashcard[];
}

type Confidence = 1 | 2 | 3;

const confidenceOptions: {
    value: Confidence;
    label: string;
}[] = [
        {
            value: 1,
            label: "Need work",
        },
        {
            value: 2,
            label: "Okay",
        },
        {
            value: 3,
            label: "Confident",
        },
    ];

export default function FlashcardPractice({
    kitId,
    flashcards,
}: FlashcardPracticeProps) {
    const [progress, setProgress] = useState<
        FlashcardPracticeProgress[]
    >([]);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [revealed, setRevealed] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const progressMap = useMemo(
        () =>
            new Map(
                progress.map(item => [
                    item.flashcardId,
                    item,
                ]),
            ),
        [progress],
    );

    /*
    * The backend/core prioritization determines
    * practice order. We duplicate the small
    * deterministic rule here so the UI can
    * immediately move to the weakest card after
    * reviewing one.
    */
    const orderedFlashcards = useMemo(() => {
        const confidenceScore = (
            confidence: Confidence | null | undefined,
        ) => confidence ?? 0;

        const timestamp = (
            value: string | null | undefined,
        ) => {
            if (!value) return 0;

            const parsed = Date.parse(value);

            return Number.isNaN(parsed)
                ? 0
                : parsed;
        };

        return [...flashcards].sort((a, b) => {
            const aProgress =
                progressMap.get(a.id);

            const bProgress =
                progressMap.get(b.id);

            const aCovered =
                aProgress?.covered ?? false;

            const bCovered =
                bProgress?.covered ?? false;

            if (aCovered !== bCovered) {
                return aCovered ? 1 : -1;
            }

            const confidenceDifference =
                confidenceScore(
                    aProgress?.confidence,
                ) -
                confidenceScore(
                    bProgress?.confidence,
                );

            if (confidenceDifference !== 0) {
                return confidenceDifference;
            }

            const reviewDifference =
                timestamp(
                    aProgress?.lastReviewedAt,
                ) -
                timestamp(
                    bProgress?.lastReviewedAt,
                );

            if (reviewDifference !== 0) {
                return reviewDifference;
            }

            return a.id.localeCompare(b.id);
        });
    }, [flashcards, progressMap]);

    const currentCard =
        orderedFlashcards[currentIndex];

    const currentProgress = currentCard
        ? progressMap.get(currentCard.id)
        : undefined;

    const coveredCount = progress.filter(
        item => item.covered,
    ).length;

    useEffect(() => {
        let cancelled = false;

        async function loadProgress() {
            try {
                setLoading(true);
                setError(null);

                const response =
                    await apiFetch<{
                        progress: FlashcardPracticeProgress[];
                    }>(
                        `/api/kits/${kitId}/flashcards/progress`,
                    );

                if (!cancelled) {
                    setProgress(
                        response.progress,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load practice progress.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadProgress();

        return () => {
            cancelled = true;
        };
    }, [kitId]);

    useEffect(() => {
        setCurrentIndex(index =>
            Math.min(
                index,
                Math.max(
                    0,
                    orderedFlashcards.length - 1,
                ),
            ),
        );
    }, [orderedFlashcards.length]);

    function nextCard() {
        if (
            orderedFlashcards.length === 0
        ) {
            return;
        }

        setCurrentIndex(index =>
            Math.min(
                index + 1,
                orderedFlashcards.length - 1,
            ),
        );

        setRevealed(false);
    }

    function previousCard() {
        setCurrentIndex(index =>
            Math.max(0, index - 1),
        );

        setRevealed(false);
    }

    async function saveConfidence(
        confidence: Confidence,
    ) {
        if (!currentCard || saving) {
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const response =
                await apiFetch<{
                    progress: FlashcardPracticeProgress;
                }>(
                    `/api/kits/${kitId}/flashcards/${currentCard.id}/review`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            confidence,
                        }),
                    },
                );

            setProgress(current => [
                ...current.filter(
                    item =>
                        item.flashcardId !==
                        currentCard.id,
                ),
                response.progress,
            ]);

            setRevealed(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save confidence.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function resetCurrentCard() {
        if (!currentCard || saving) {
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await apiFetch(
                `/api/kits/${kitId}/flashcards/${currentCard.id}/reset-progress`,
                {
                    method: "POST",
                },
            );

            setProgress(current =>
                current.filter(
                    item =>
                        item.flashcardId !==
                        currentCard.id,
                ),
            );

            setRevealed(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to reset progress.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <section className="rounded-2xl border border-border bg-background p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 w-40 rounded bg-surface" />
                    <div className="h-48 rounded-xl bg-surface" />
                    <div className="h-10 rounded bg-surface" />
                </div>
            </section>
        );
    }

    if (flashcards.length === 0) {
        return (
            <section className="rounded-2xl border border-border bg-background p-6">
                <h2 className="text-xl font-semibold text-foreground">
                    Practice Flashcards
                </h2>

                <p className="mt-2 text-sm text-text-muted">
                    No flashcards are available yet.
                </p>
            </section>
        );
    }

    if (!currentCard) {
        return null;
    }

    return (
        <section
            className="rounded-2xl border border-border bg-background p-6"
            aria-label="Flashcard practice"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Practice Flashcards
                    </h2>

                    <p className="mt-1 text-sm text-text-muted">
                        Review your weakest cards
                        first.
                    </p>
                </div>

                <div className="text-sm text-text-muted">
                    Covered{" "}
                    <span className="font-semibold text-foreground">
                        {coveredCount}
                    </span>{" "}
                    / {flashcards.length}
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mt-4 rounded-lg border border-error bg-error-light px-4 py-3 text-sm text-error"
                >
                    {error}
                </div>
            )}

            <div className="mt-6 flex items-center justify-between text-sm text-text-muted">
                <span>
                    Card {currentIndex + 1} of{" "}
                    {orderedFlashcards.length}
                </span>

                {currentProgress?.covered && (
                    <span className="inline-flex items-center gap-1 text-success">
                        <Check className="h-4 w-4" />
                        Covered
                    </span>
                )}
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="border-b border-border p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Question
                    </p>

                    <h3 className="mt-3 text-lg font-semibold leading-7 text-foreground">
                        {currentCard.front}
                    </h3>
                </div>

                {revealed && (
                    <div className="p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            Answer
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                            {currentCard.back}
                        </p>
                    </div>
                )}
            </div>

            {!revealed ? (
                <button
                    type="button"
                    onClick={() =>
                        setRevealed(true)
                    }
                    className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    Reveal Answer
                </button>
            ) : (
                <div className="mt-5">
                    <p className="text-sm font-medium text-foreground">
                        How confident are you?
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {confidenceOptions.map(
                            option => {
                                const selected =
                                    currentProgress?.confidence ===
                                    option.value;

                                return (
                                    <button
                                        key={
                                            option.value
                                        }
                                        type="button"
                                        disabled={
                                            saving
                                        }
                                        onClick={() =>
                                            void saveConfidence(
                                                option.value,
                                            )
                                        }
                                        className={[
                                            "rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                            selected
                                                ? "border-primary bg-primary-light text-primary"
                                                : "border-border bg-background text-foreground hover:bg-surface",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                );
                            },
                        )}
                    </div>
                </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={previousCard}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </button>

                <button
                    type="button"
                    onClick={() =>
                        void resetCurrentCard()
                    }
                    disabled={
                        saving ||
                        !currentProgress
                    }
                    title="Reset this card's practice progress"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                </button>

                <button
                    type="button"
                    onClick={nextCard}
                    disabled={
                        currentIndex ===
                        orderedFlashcards.length - 1
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </section>
    );
}

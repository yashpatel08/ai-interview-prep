"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { apiFetch } from "@/lib/api";

type QuestionCategory =
    | "technical"
    | "behavioral"
    | "system_design"
    | "company_fit";

type RegenerateSection =
    | "company_brief"
    | "questions"
    | "flashcards";

import type {
    InterviewKit,
} from "@ai-interview-prep/core";

interface RegenerateControlsProps {
    kitId: string;
    onRegenerated: (
        kit: InterviewKit,
    ) => void;
}

const categories: Array<{
    value: QuestionCategory;
    label: string;
}> = [
        {
            value: "technical",
            label: "Technical",
        },
        {
            value: "behavioral",
            label: "Behavioral",
        },
        {
            value: "system_design",
            label: "System Design",
        },
        {
            value: "company_fit",
            label: "Company Fit",
        },
    ];

export default function RegenerateControls({
    kitId,
    onRegenerated,
}: RegenerateControlsProps) {
    const [loading, setLoading] =
        useState<RegenerateSection | null>(null);

    const [category, setCategory] =
        useState<QuestionCategory>("technical");

    const [error, setError] =
        useState<string | null>(null);

    async function regenerate(
        section: RegenerateSection,
        selectedCategory?: QuestionCategory,
    ) {
        if (loading) {
            return;
        }

        setLoading(section);
        setError(null);

        try {
            const body: {
                section: RegenerateSection;
                category?: QuestionCategory;
            } = {
                section,
            };

            if (
                section === "questions" &&
                selectedCategory
            ) {
                body.category = selectedCategory;
            }

            const response =
                await apiFetch<{
                    kit: {
                        kit: InterviewKit;
                    };
                }>(
                    `/api/kits/${kitId}/regenerate`,
                    {
                        method: "POST",
                        body: JSON.stringify(body),
                    },
                );

            if (!response.kit.kit) {
                throw new Error(
                    "Regeneration returned no kit data.",
                );
            }

            onRegenerated(response.kit.kit);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Regeneration failed.",
            );
        } finally {
            setLoading(null);
        }
    }

    const isLoading =
        loading !== null;

    return (
        <section className="rounded-xl border border-border bg-background p-5 mt-3">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Regenerate content
                    </h2>

                    <p className="mt-1 text-sm text-text-muted">
                        Regenerate a section without
                        replacing your edited or pinned
                        content.
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                    {/* Company brief */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                            regenerate(
                                "company_brief",
                            )
                        }
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ===
                                "company_brief"
                                ? "animate-spin"
                                : ""
                                }`}
                        />

                        {loading ===
                            "company_brief"
                            ? "Regenerating..."
                            : "Company Brief"}
                    </button>

                    {/* All questions */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                            regenerate("questions")
                        }
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ===
                                "questions"
                                ? "animate-spin"
                                : ""
                                }`}
                        />

                        {loading === "questions"
                            ? "Regenerating..."
                            : "All Questions"}
                    </button>

                    {/* Flashcards */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                            regenerate(
                                "flashcards",
                            )
                        }
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ===
                                "flashcards"
                                ? "animate-spin"
                                : ""
                                }`}
                        />

                        {loading === "flashcards"
                            ? "Regenerating..."
                            : "Flashcards"}
                    </button>
                </div>

                {/* Question category regeneration */}
                <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-foreground">
                            Regenerate one question category
                        </h3>

                        <p className="mt-1 text-xs text-text-muted">
                            Other question categories will
                            remain unchanged.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={category}
                            disabled={isLoading}
                            onChange={(event) =>
                                setCategory(
                                    event.target
                                        .value as QuestionCategory,
                                )
                            }
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {categories.map(
                                (item) => (
                                    <option
                                        key={
                                            item.value
                                        }
                                        value={
                                            item.value
                                        }
                                    >
                                        {item.label}
                                    </option>
                                ),
                            )}
                        </select>

                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                                regenerate(
                                    "questions",
                                    category,
                                )
                            }
                            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ===
                                    "questions"
                                    ? "animate-spin"
                                    : ""
                                    }`}
                            />

                            {loading === "questions"
                                ? "Regenerating..."
                                : "Regenerate Category"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
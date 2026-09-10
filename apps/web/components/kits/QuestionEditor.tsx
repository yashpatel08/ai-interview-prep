"use client";

import {
    Pin,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";

import { apiFetch } from "@/lib/api";

import type {
    Question,
    QuestionCategory,
    Requirement,
} from "@ai-interview-prep/core";

interface QuestionEditorProps {
    kitId: string;
    initialQuestions: Question[];
    requirements?: Requirement[];
    onQuestionsChange?: (
        questions: Question[],
    ) => void;
}

const categoryLabels: Record<
    QuestionCategory,
    string
> = {
    technical: "Technical",
    behavioral: "Behavioral",
    system_design: "System Design",
    company_fit: "Company Fit",
};

const emptyDraft = {
    prompt: "",
    answer_outline: "",
    category: "technical" as QuestionCategory,
    difficulty: 1 as 1 | 2 | 3,
    requirement_ids: [] as string[],
};

export default function QuestionEditor({
    kitId,
    initialQuestions,
    requirements = [],
    onQuestionsChange,
}: QuestionEditorProps) {
    const [questions, setQuestions] =
        useState<Question[]>(initialQuestions);

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [adding, setAdding] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState<string | null>(null);

    const [pinningId, setPinningId] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [draft, setDraft] =
        useState<Partial<Question>>({});

    function updateQuestions(
        next: Question[],
    ) {
        setQuestions(next);
        onQuestionsChange?.(next);
    }

    function startAdd() {
        setAdding(true);
        setEditingId(null);
        setDraft(emptyDraft);
        setError(null);
    }

    function cancelAdd() {
        setAdding(false);
        setDraft({});
        setError(null);
    }

    function startEdit(
        question: Question,
    ) {
        setEditingId(question.id);
        setAdding(false);

        setDraft({
            prompt: question.prompt,
            answer_outline:
                question.answer_outline,
            category: question.category,
            difficulty:
                question.difficulty,
            requirement_ids:
                question.requirement_ids,
        });

        setError(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setDraft({});
        setError(null);
    }

    function toggleRequirement(
        requirementId: string,
    ) {
        setDraft((current) => {
            const currentIds =
                current.requirement_ids ?? [];

            const exists =
                currentIds.includes(
                    requirementId,
                );

            return {
                ...current,
                requirement_ids: exists
                    ? currentIds.filter(
                        (id) =>
                            id !==
                            requirementId,
                    )
                    : [
                        ...currentIds,
                        requirementId,
                    ],
            };
        });
    }

    async function addQuestion() {
        if (!draft.prompt?.trim()) {
            setError(
                "Question is required.",
            );
            return;
        }

        if (
            !draft.answer_outline?.trim()
        ) {
            setError(
                "Answer outline is required.",
            );
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response =
                await apiFetch<{
                    kit: {
                        kit: {
                            questions: Question[];
                        };
                    };
                }>(
                    `/api/kits/${kitId}/questions`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            prompt:
                                draft.prompt.trim(),
                            answer_outline:
                                draft.answer_outline.trim(),
                            category:
                                draft.category ??
                                "technical",
                            difficulty:
                                draft.difficulty ??
                                1,
                            requirement_ids:
                                draft.requirement_ids ??
                                [],
                        }),
                    },
                );

            updateQuestions(
                response.kit.kit.questions,
            );

            cancelAdd();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to add question.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function togglePin(
        questionId: string,
        pinned: boolean,
    ) {
        setPinningId(questionId);
        setError(null);

        try {
            const response =
                await apiFetch<{
                    question: Question;
                }>(
                    `/api/kits/${kitId}/questions/${questionId}/pin`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            pinned,
                        }),
                    },
                );

            updateQuestions(
                questions.map(
                    (question) =>
                        question.id ===
                            questionId
                            ? response.question
                            : question,
                ),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update pin.",
            );
        } finally {
            setPinningId(null);
        }
    }

    async function saveEdit(
        questionId: string,
    ) {
        if (
            !draft.prompt?.trim() ||
            !draft.answer_outline?.trim()
        ) {
            setError(
                "Question and answer outline are required.",
            );
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response =
                await apiFetch<{
                    kit: {
                        kit: {
                            questions: Question[];
                        };
                    };
                }>(
                    `/api/kits/${kitId}/questions/${questionId}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            prompt:
                                draft.prompt.trim(),
                            answer_outline:
                                draft.answer_outline.trim(),
                            category:
                                draft.category,
                            difficulty:
                                draft.difficulty,
                            requirement_ids:
                                draft.requirement_ids ??
                                [],
                        }),
                    },
                );

            updateQuestions(
                response.kit.kit.questions,
            );

            cancelEdit();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save question.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteQuestion(
        questionId: string,
    ) {
        if (
            !window.confirm(
                "Delete this question?",
            )
        ) {
            return;
        }

        setDeletingId(questionId);
        setError(null);

        try {
            const response =
                await apiFetch<{
                    kit: {
                        kit: {
                            questions: Question[];
                        };
                    };
                }>(
                    `/api/kits/${kitId}/questions/${questionId}`,
                    {
                        method: "DELETE",
                    },
                );

            updateQuestions(
                response.kit.kit.questions,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete question.",
            );
        } finally {
            setDeletingId(null);
        }
    }

    function renderQuestionForm(
        mode: "add" | "edit",
        questionId?: string,
    ) {
        return (
            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Question
                    </label>

                    <textarea
                        value={
                            draft.prompt ?? ""
                        }
                        onChange={(event) =>
                            setDraft(
                                (current) => ({
                                    ...current,
                                    prompt:
                                        event
                                            .target
                                            .value,
                                }),
                            )
                        }
                        rows={4}
                        placeholder="Enter interview question..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Answer outline
                    </label>

                    <textarea
                        value={
                            draft.answer_outline ??
                            ""
                        }
                        onChange={(event) =>
                            setDraft(
                                (current) => ({
                                    ...current,
                                    answer_outline:
                                        event
                                            .target
                                            .value,
                                }),
                            )
                        }
                        rows={6}
                        placeholder="Enter the key points a strong answer should cover..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Category
                        </label>

                        <select
                            value={
                                draft.category ??
                                "technical"
                            }
                            onChange={(event) =>
                                setDraft(
                                    (current) => ({
                                        ...current,
                                        category:
                                            event
                                                .target
                                                .value as QuestionCategory,
                                    }),
                                )
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        >
                            {Object.entries(
                                categoryLabels,
                            ).map(
                                ([
                                    value,
                                    label,
                                ]) => (
                                    <option
                                        key={
                                            value
                                        }
                                        value={
                                            value
                                        }
                                    >
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Difficulty
                        </label>

                        <select
                            value={
                                draft.difficulty ??
                                1
                            }
                            onChange={(event) =>
                                setDraft(
                                    (current) => ({
                                        ...current,
                                        difficulty:
                                            Number(
                                                event
                                                    .target
                                                    .value,
                                            ) as
                                            | 1
                                            | 2
                                            | 3,
                                    }),
                                )
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        >
                            <option value="1">
                                1 — Easy
                            </option>

                            <option value="2">
                                2 — Medium
                            </option>

                            <option value="3">
                                3 — Hard
                            </option>
                        </select>
                    </div>
                </div>

                {requirements.length >
                    0 && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                                Requirements covered
                            </label>

                            <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
                                {requirements.map(
                                    (
                                        requirement,
                                    ) => {
                                        const selected =
                                            (
                                                draft.requirement_ids ??
                                                []
                                            ).includes(
                                                requirement.id,
                                            );

                                        return (
                                            <label
                                                key={
                                                    requirement.id
                                                }
                                                className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-background"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selected
                                                    }
                                                    onChange={() =>
                                                        toggleRequirement(
                                                            requirement.id,
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 accent-[var(--primary)]"
                                                />

                                                <span className="text-sm text-foreground">
                                                    {
                                                        requirement.text
                                                    }

                                                    <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                                                        {
                                                            requirement.priority
                                                        }
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    )}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={
                            mode === "add"
                                ? cancelAdd
                                : cancelEdit
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                            mode === "add"
                                ? addQuestion()
                                : questionId
                                    ? saveEdit(
                                        questionId,
                                    )
                                    : undefined
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />

                        {saving
                            ? "Saving..."
                            : mode === "add"
                                ? "Add question"
                                : "Save"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="mt-10">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Interview questions
                    </h2>

                    <p className="mt-1 text-sm text-text-muted">
                        Edit, delete, pin, or refine your
                        generated questions.
                    </p>
                </div>

                {!adding && (
                    <button
                        type="button"
                        onClick={startAdd}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add question
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-error bg-error-light px-4 py-3 text-sm text-error">
                    {error}
                </div>
            )}

            {adding && (
                <article className="mb-4 rounded-xl border border-primary bg-background p-5">
                    <div className="mb-4">
                        <h3 className="font-semibold text-foreground">
                            Add question
                        </h3>

                        <p className="mt-1 text-sm text-text-muted">
                            Create a custom interview question.
                        </p>
                    </div>

                    {renderQuestionForm("add")}
                </article>
            )}

            {questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
                    <p className="text-sm text-text-muted">
                        No interview questions yet.
                    </p>

                    {!adding && (
                        <button
                            type="button"
                            onClick={startAdd}
                            className="mt-3 text-sm font-medium text-primary hover:underline"
                        >
                            Add your first question
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map(
                        (
                            question,
                            index,
                        ) => {
                            const editing =
                                editingId ===
                                question.id;

                            const isPinned =
                                question.state ===
                                "pinned";

                            const isPinning =
                                pinningId ===
                                question.id;

                            const isDeleting =
                                deletingId ===
                                question.id;

                            return (
                                <article
                                    key={
                                        question.id
                                    }
                                    className={`rounded-xl border bg-background p-5 transition ${isPinned
                                            ? "border-primary/40"
                                            : "border-border"
                                        }`}
                                >
                                    {/* Question card header */}
                                    <div className="mb-4 flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-sm font-semibold text-primary">
                                                {index +
                                                    1}
                                            </span>

                                            {question.state && (
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${question.state ===
                                                            "pinned"
                                                            ? "bg-primary-light text-primary"
                                                            : question.state ===
                                                                "edited"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-surface text-text-muted"
                                                        }`}
                                                >
                                                    {question.state ===
                                                        "pinned"
                                                        ? "Pinned"
                                                        : question.state ===
                                                            "edited"
                                                            ? "Edited"
                                                            : "Generated"}
                                                </span>
                                            )}

                                            <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-muted">
                                                {
                                                    categoryLabels[
                                                    question
                                                        .category
                                                    ]
                                                }
                                            </span>

                                            <span className="text-xs text-text-muted">
                                                Difficulty{" "}
                                                {
                                                    question.difficulty
                                                }
                                                /3
                                            </span>
                                        </div>

                                        {!editing && (
                                            <div className="flex shrink-0 items-center gap-2">
                                                {/* Pin / Unpin */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        togglePin(
                                                            question.id,
                                                            !isPinned,
                                                        )
                                                    }
                                                    disabled={
                                                        isPinning
                                                    }
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${isPinned
                                                            ? "border-primary bg-primary-light text-primary hover:bg-primary-light"
                                                            : "border-border bg-background text-text-muted hover:bg-surface hover:text-foreground"
                                                        }`}
                                                    aria-label={
                                                        isPinned
                                                            ? "Unpin question"
                                                            : "Pin question"
                                                    }
                                                    title={
                                                        isPinned
                                                            ? "Unpin question"
                                                            : "Pin question"
                                                    }
                                                >
                                                    <Pin
                                                        className="h-4 w-4"
                                                        fill={
                                                            isPinned
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                    />

                                                    {isPinning
                                                        ? "Saving..."
                                                        : isPinned
                                                            ? "Unpin"
                                                            : "Pin"}
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startEdit(
                                                            question,
                                                        )
                                                    }
                                                    className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-surface hover:text-foreground"
                                                    aria-label="Edit question"
                                                    title="Edit question"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteQuestion(
                                                            question.id,
                                                        )
                                                    }
                                                    disabled={
                                                        isDeleting
                                                    }
                                                    className="rounded-lg border border-border p-2 text-error transition hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-50"
                                                    aria-label="Delete question"
                                                    title="Delete question"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Question content */}
                                    {editing ? (
                                        renderQuestionForm(
                                            "edit",
                                            question.id,
                                        )
                                    ) : (
                                        <>
                                            <h3 className="text-base font-semibold leading-7 text-foreground">
                                                {
                                                    question.prompt
                                                }
                                            </h3>

                                            <div className="mt-4 rounded-lg bg-surface p-4">
                                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                                    Answer
                                                    outline
                                                </p>

                                                <p className="text-sm leading-6 text-text-muted">
                                                    {
                                                        question.answer_outline
                                                    }
                                                </p>
                                            </div>

                                            {/* Requirements */}
                                            {question.requirement_ids.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                                        Covers
                                                    </p>

                                                    <div className="space-y-1.5">
                                                        {question.requirement_ids.map(
                                                            (
                                                                requirementId,
                                                                requirementIndex,
                                                            ) => {
                                                                const requirement =
                                                                    requirements.find(
                                                                        (item) =>
                                                                            item.id ===
                                                                            requirementId,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={requirementId}
                                                                        className="flex items-start gap-2 text-sm text-text-muted"
                                                                    >
                                                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                                                                        <span>
                                                                            {requirement?.text ??
                                                                                `Requirement ${requirementIndex +
                                                                                1
                                                                                }`}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </article>
                            );
                        },
                    )}
                </div>
            )}
        </section>
    );
}
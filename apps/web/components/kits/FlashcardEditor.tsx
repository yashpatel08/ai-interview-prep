"use client";

import { useState } from "react";
import {
    Pin,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

import type {
    Flashcard,
    Requirement,
} from "@ai-interview-prep/core";

interface FlashcardEditorProps {
    kitId: string;
    initialFlashcards: Flashcard[];
    requirements?: Requirement[];
    onFlashcardsChange?: (
        flashcards: Flashcard[],
    ) => void;
}

interface FlashcardDraft {
    front: string;
    back: string;
    requirement_ids: string[];
}

const emptyDraft: FlashcardDraft = {
    front: "",
    back: "",
    requirement_ids: [],
};

export default function FlashcardEditor({
    kitId,
    initialFlashcards,
    requirements = [],
    onFlashcardsChange,
}: FlashcardEditorProps) {
    const [flashcards, setFlashcards] =
        useState<Flashcard[]>(
            initialFlashcards,
        );

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
        useState<FlashcardDraft>({
            ...emptyDraft,
            requirement_ids: [],
        });

    function updateFlashcards(
        next: Flashcard[],
    ) {
        setFlashcards(next);
        onFlashcardsChange?.(next);
    }

    function startAdd() {
        setAdding(true);
        setEditingId(null);
        setDraft({
            ...emptyDraft,
            requirement_ids: [],
        });
        setError(null);
    }

    function cancelAdd() {
        setAdding(false);
        setDraft({
            ...emptyDraft,
            requirement_ids: [],
        });
        setError(null);
    }

    function startEdit(
        flashcard: Flashcard,
    ) {
        setEditingId(flashcard.id);
        setAdding(false);

        setDraft({
            front: flashcard.front,
            back: flashcard.back,
            requirement_ids: [
                ...flashcard.requirement_ids,
            ],
        });

        setError(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setDraft({
            ...emptyDraft,
            requirement_ids: [],
        });
        setError(null);
    }

    function toggleRequirement(
        requirementId: string,
    ) {
        setDraft((current) => {
            const exists =
                current.requirement_ids.includes(
                    requirementId,
                );

            return {
                ...current,
                requirement_ids: exists
                    ? current.requirement_ids.filter(
                          (id) =>
                              id !==
                              requirementId,
                      )
                    : [
                          ...current.requirement_ids,
                          requirementId,
                      ],
            };
        });
    }

    async function addFlashcard() {
        if (!draft.front.trim()) {
            setError(
                "Front of flashcard is required.",
            );
            return;
        }

        if (!draft.back.trim()) {
            setError(
                "Back of flashcard is required.",
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
                            flashcards:
                                Flashcard[];
                        };
                    };
                }>(
                    `/api/kits/${kitId}/flashcards`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            front: draft.front.trim(),
                            back: draft.back.trim(),
                            requirement_ids:
                                draft.requirement_ids,
                        }),
                    },
                );

            updateFlashcards(
                response.kit.kit.flashcards,
            );

            cancelAdd();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to add flashcard.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function saveEdit(
        flashcardId: string,
    ) {
        if (!draft.front.trim()) {
            setError(
                "Front of flashcard is required.",
            );
            return;
        }

        if (!draft.back.trim()) {
            setError(
                "Back of flashcard is required.",
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
                            flashcards:
                                Flashcard[];
                        };
                    };
                }>(
                    `/api/kits/${kitId}/flashcards/${flashcardId}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            front: draft.front.trim(),
                            back: draft.back.trim(),
                            requirement_ids:
                                draft.requirement_ids,
                        }),
                    },
                );

            updateFlashcards(
                response.kit.kit.flashcards,
            );

            cancelEdit();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save flashcard.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteFlashcard(
        flashcardId: string,
    ) {
        if (
            !window.confirm(
                "Delete this flashcard?",
            )
        ) {
            return;
        }

        setDeletingId(flashcardId);
        setError(null);

        try {
            const response =
                await apiFetch<{
                    kit: {
                        kit: {
                            flashcards:
                                Flashcard[];
                        };
                    };
                }>(
                    `/api/kits/${kitId}/flashcards/${flashcardId}`,
                    {
                        method: "DELETE",
                    },
                );

            updateFlashcards(
                response.kit.kit.flashcards,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete flashcard.",
            );
        } finally {
            setDeletingId(null);
        }
    }

    async function togglePin(
        flashcardId: string,
        pinned: boolean,
    ) {
        setPinningId(flashcardId);
        setError(null);

        try {
            const response =
                await apiFetch<{
                    flashcard: Flashcard;
                }>(
                    `/api/kits/${kitId}/flashcards/${flashcardId}/pin`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            pinned,
                        }),
                    },
                );

            updateFlashcards(
                flashcards.map(
                    (flashcard) =>
                        flashcard.id ===
                        flashcardId
                            ? response.flashcard
                            : flashcard,
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

    function renderForm() {
        return (
            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Front
                    </label>

                    <textarea
                        value={draft.front}
                        onChange={(event) =>
                            setDraft(
                                (current) => ({
                                    ...current,
                                    front: event
                                        .target
                                        .value,
                                }),
                            )
                        }
                        rows={3}
                        placeholder="What should you remember?"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Back
                    </label>

                    <textarea
                        value={draft.back}
                        onChange={(event) =>
                            setDraft(
                                (current) => ({
                                    ...current,
                                    back: event
                                        .target
                                        .value,
                                }),
                            )
                        }
                        rows={5}
                        placeholder="Enter the answer or key facts..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                </div>

                {requirements.length > 0 && (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                            Requirements covered
                        </label>

                        <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
                            {requirements.map(
                                (requirement) => {
                                    const selected =
                                        draft.requirement_ids.includes(
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
                            adding
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
                            adding
                                ? addFlashcard()
                                : editingId
                                  ? saveEdit(
                                        editingId,
                                    )
                                  : undefined
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />

                        {saving
                            ? "Saving..."
                            : adding
                              ? "Add flashcard"
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
                        Flashcards
                    </h2>

                    <p className="mt-1 text-sm text-text-muted">
                        Edit, delete, pin, or add study
                        flashcards.
                    </p>
                </div>

                {!adding && (
                    <button
                        type="button"
                        onClick={startAdd}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add flashcard
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
                            Add flashcard
                        </h3>

                        <p className="mt-1 text-sm text-text-muted">
                            Create a custom study flashcard.
                        </p>
                    </div>

                    {renderForm()}
                </article>
            )}

            {flashcards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
                    <p className="text-sm text-text-muted">
                        No flashcards yet.
                    </p>

                    {!adding && (
                        <button
                            type="button"
                            onClick={startAdd}
                            className="mt-3 text-sm font-medium text-primary hover:underline"
                        >
                            Add your first flashcard
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {flashcards.map(
                        (
                            flashcard,
                            index,
                        ) => {
                            const editing =
                                editingId ===
                                flashcard.id;

                            const isPinned =
                                flashcard.state ===
                                "pinned";

                            const isPinning =
                                pinningId ===
                                flashcard.id;

                            const isDeleting =
                                deletingId ===
                                flashcard.id;

                            return (
                                <article
                                    key={
                                        flashcard.id
                                    }
                                    className={`rounded-xl border bg-background p-5 transition ${
                                        isPinned
                                            ? "border-primary/40"
                                            : "border-border"
                                    }`}
                                >
                                    {/* Header */}
                                    <div className="mb-4 flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-sm font-semibold text-primary">
                                                {index +
                                                    1}
                                            </span>

                                            {flashcard.state && (
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        flashcard.state ===
                                                        "pinned"
                                                            ? "bg-primary-light text-primary"
                                                            : flashcard.state ===
                                                                "edited"
                                                              ? "bg-amber-50 text-amber-700"
                                                              : "bg-surface text-text-muted"
                                                    }`}
                                                >
                                                    {flashcard.state ===
                                                    "pinned"
                                                        ? "Pinned"
                                                        : flashcard.state ===
                                                            "edited"
                                                          ? "Edited"
                                                          : "Generated"}
                                                </span>
                                            )}
                                        </div>

                                        {!editing && (
                                            <div className="flex shrink-0 items-center gap-2">
                                                {/* Pin */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        togglePin(
                                                            flashcard.id,
                                                            !isPinned,
                                                        )
                                                    }
                                                    disabled={
                                                        isPinning
                                                    }
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        isPinned
                                                            ? "border-primary bg-primary-light text-primary hover:bg-primary-light"
                                                            : "border-border bg-background text-text-muted hover:bg-surface hover:text-foreground"
                                                    }`}
                                                    aria-label={
                                                        isPinned
                                                            ? "Unpin flashcard"
                                                            : "Pin flashcard"
                                                    }
                                                    title={
                                                        isPinned
                                                            ? "Unpin flashcard"
                                                            : "Pin flashcard"
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
                                                            flashcard,
                                                        )
                                                    }
                                                    className="rounded-lg border border-border p-2 text-text-muted transition hover:bg-surface hover:text-foreground"
                                                    aria-label="Edit flashcard"
                                                    title="Edit flashcard"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteFlashcard(
                                                            flashcard.id,
                                                        )
                                                    }
                                                    disabled={
                                                        isDeleting
                                                    }
                                                    className="rounded-lg border border-border p-2 text-error transition hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-50"
                                                    aria-label="Delete flashcard"
                                                    title="Delete flashcard"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    {editing ? (
                                        renderForm()
                                    ) : (
                                        <>
                                            <div>
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                                    Front
                                                </p>

                                                <p className="text-base font-semibold leading-7 text-foreground">
                                                    {
                                                        flashcard.front
                                                    }
                                                </p>
                                            </div>

                                            <div className="mt-4 rounded-lg bg-surface p-4">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                                    Back
                                                </p>

                                                <p className="text-sm leading-6 text-text-muted">
                                                    {
                                                        flashcard.back
                                                    }
                                                </p>
                                            </div>

                                            {/* Requirements */}
                                            {flashcard
                                                .requirement_ids
                                                .length >
                                                0 && (
                                                <div className="mt-4">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                                        Covers
                                                    </p>

                                                    <div className="space-y-1.5">
                                                        {flashcard.requirement_ids.map(
                                                            (
                                                                requirementId,
                                                                requirementIndex,
                                                            ) => {
                                                                const requirement =
                                                                    requirements.find(
                                                                        (
                                                                            item,
                                                                        ) =>
                                                                            item.id ===
                                                                            requirementId,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            requirementId
                                                                        }
                                                                        className="flex items-start gap-2 text-sm text-text-muted"
                                                                    >
                                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                                                                        <span>
                                                                            {requirement?.text ??
                                                                                `Requirement ${
                                                                                    requirementIndex +
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
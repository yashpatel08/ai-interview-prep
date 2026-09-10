"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    ArrowRight,
    BriefcaseBusiness,
    Loader2,
    Plus,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Kit {
    _id: string;
    status: "generating" | "ready" | "failed";
    source: {
        company: string;
        company_url: string;
        role: string;
        location: string;
        jd_chars: number;
    };
    generation: {
        status: string;
        progress: number;
        error: {
            code: string;
            message: string;
        } | null;
    };
    createdAt: string;
    updatedAt: string;
}

interface KitsResponse {
    kits: Kit[];
}

interface MeResponse {
    user: {
        id: string;
        email: string;
    };
}

export default function KitsPage() {
    const [kits, setKits] = useState<Kit[]>([]);
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadDashboard() {
        setLoading(true);
        setError("");

        try {
            const [me, kitsResponse] = await Promise.all([
                apiFetch<MeResponse>("/api/auth/me"),
                apiFetch<KitsResponse>("/api/kits"),
            ]);

            setEmail(me.user.email);
            setKits(kitsResponse.kits);
        } catch (err) {
            if (
                err instanceof Error &&
                err.message.toLowerCase().includes("authentication")
            ) {
                window.location.href = "/login";
                return;
            }

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your interview kits.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadDashboard();
    }, []);

    async function handleLogout() {
        try {
            await apiFetch("/api/auth/logout", {
                method: "POST",
            });
        } finally {
            window.location.href = "/login";
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-background">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                            AI
                        </div>

                        <span className="text-lg font-semibold tracking-tight text-foreground">
                            Interview Prep
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {email && (
                            <span className="hidden text-sm text-text-muted sm:block">
                                {email}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-sm font-medium text-text-muted transition hover:text-foreground"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-6 py-10">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                            <Sparkles size={16} />
                            Preparation workspace
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Your interview kits
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
                            Create a preparation kit for each role you are
                            interviewing for.
                        </p>
                    </div>

                    <Link
                        href="/kits/new"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
                    >
                        <Plus size={17} />
                        New interview kit
                    </Link>
                </div>

                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState
                        message={error}
                        onRetry={loadDashboard}
                    />
                ) : kits.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {kits.map((kit) => (
                            <KitCard
                                key={kit._id}
                                kit={kit}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

/* ----------------------------------------
   Kit Card
----------------------------------------- */

function KitCard({ kit }: { kit: Kit }) {
    const company =
        kit.source.company || "Company research pending";

    const role =
        kit.source.role || "Role details pending";

    const isGenerating = kit.status === "generating";
    const isReady = kit.status === "ready";
    const isFailed = kit.status === "failed";

    return (
        <div className="group rounded-xl border border-border bg-background p-5 transition hover:border-border-strong hover:shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <BriefcaseBusiness size={19} />
                </div>

                <StatusBadge status={kit.status} />
            </div>

            <div className="min-h-24">
                <h2 className="line-clamp-1 text-lg font-semibold text-foreground">
                    {company}
                </h2>

                <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                    {role}
                </p>

                {kit.source.location && (
                    <p className="mt-2 text-xs text-text-subtle">
                        {kit.source.location}
                    </p>
                )}
            </div>

            {isGenerating && (
                <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-text-muted">
                            {formatGenerationStage(
                                kit.generation.status,
                            )}
                        </span>

                        <span className="font-medium text-primary">
                            {kit.generation.progress}%
                        </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                                width: `${kit.generation.progress}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {isFailed && kit.generation.error && (
                <div className="mt-5 rounded-lg border border-error/20 bg-error-light px-3 py-2">
                    <p className="text-xs font-medium text-error">
                        {kit.generation.error.message}
                    </p>
                </div>
            )}

            <div className="mt-6 border-t border-border pt-4">
                {isReady ? (
                    <Link
                        href={`/kits/${kit._id}`}
                        className="flex items-center justify-between text-sm font-semibold text-primary transition hover:text-primary-hover"
                    >
                        Open interview kit
                        <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-0.5"
                        />
                    </Link>
                ) : isGenerating ? (
                    <Link
                        href={`/kits/${kit._id}`}
                        className="flex items-center justify-between text-sm font-semibold text-primary transition hover:text-primary-hover"
                    >
                        View progress
                        <ArrowRight size={16} />
                    </Link>
                ) : (
                    <span className="text-sm font-medium text-error">
                        Generation failed
                    </span>
                )}
            </div>
        </div>
    );
}

/* ----------------------------------------
   Status
----------------------------------------- */

function StatusBadge({
    status,
}: {
    status: Kit["status"];
}) {
    if (status === "ready") {
        return (
            <span className="rounded-full bg-success-light px-2.5 py-1 text-xs font-medium text-success">
                Ready
            </span>
        );
    }

    if (status === "failed") {
        return (
            <span className="rounded-full bg-error-light px-2.5 py-1 text-xs font-medium text-error">
                Failed
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
            <Loader2
                size={12}
                className="animate-spin"
            />
            Generating
        </span>
    );
}

/* ----------------------------------------
   Loading
----------------------------------------- */

function LoadingState() {
    return (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="h-64 animate-pulse rounded-xl border border-border bg-surface"
                />
            ))}
        </div>
    );
}

/* ----------------------------------------
   Empty
----------------------------------------- */

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                <BriefcaseBusiness size={22} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-foreground">
                No interview kits yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
                Add a job description and company URL to generate your first
                personalized interview preparation kit.
            </p>

            <Link
                href="/kits/new"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
                <Plus size={17} />
                Create your first kit
            </Link>
        </div>
    );
}

/* ----------------------------------------
   Error
----------------------------------------- */

function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div className="rounded-xl border border-error/20 bg-error-light p-6">
            <h2 className="font-semibold text-error">
                Unable to load interview kits
            </h2>

            <p className="mt-1 text-sm text-error/80">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-error/30 bg-background px-3 py-2 text-sm font-medium text-error transition hover:bg-error-light"
            >
                <RefreshCw size={15} />
                Try again
            </button>
        </div>
    );
}

/* ----------------------------------------
   Helpers
----------------------------------------- */

function formatGenerationStage(stage: string) {
    const labels: Record<string, string> = {
        queued: "Queued",
        researching_company: "Researching company",
        extracting_requirements: "Extracting requirements",
        generating_company_brief: "Building company brief",
        generating_questions: "Generating questions",
        checking_coverage: "Checking coverage",
        closing_gaps: "Closing coverage gaps",
        generating_flashcards: "Creating flashcards",
        building_schedule: "Building study schedule",
        validating: "Validating kit",
        complete: "Complete",
        failed: "Failed",
    };

    return labels[stage] ?? "Preparing kit";
}
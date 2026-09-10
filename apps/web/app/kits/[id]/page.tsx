"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    BookOpen,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Clock3,
    FileText,
    Loader2,
    RefreshCw,
    Sparkles,
    Target,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import QuestionEditor from "@/components/kits/QuestionEditor";
import type { InterviewKit } from "@ai-interview-prep/core";
import FlashcardEditor from "@/components/kits/FlashcardEditor";
import FlashcardPractice from "@/components/flashcards/FlashcardPractice";
import RegenerateControls from "@/components/kits/RegenerateControls";
type GenerationStage =
    | "queued"
    | "researching_company"
    | "extracting_requirements"
    | "generating_company_brief"
    | "generating_questions"
    | "checking_coverage"
    | "closing_gaps"
    | "generating_flashcards"
    | "building_schedule"
    | "validating"
    | "complete"
    | "failed";

interface Generation {
    status: GenerationStage;
    progress: number;
    error: {
        code: string;
        message: string;
    } | null;
    startedAt: string | null;
    completedAt: string | null;
}

interface KitResponse {
    kit: {
        id: string;
        status: "generating" | "ready" | "failed";
        source: InterviewKit["source"];
        generation: Generation;
        kit: InterviewKit | null;
    };
}

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const STAGE_LABELS: Record<GenerationStage, string> = {
    queued: "Preparing your interview kit",
    researching_company: "Researching company",
    extracting_requirements: "Extracting role requirements",
    generating_company_brief: "Building company brief",
    generating_questions: "Generating interview questions",
    checking_coverage: "Checking requirement coverage",
    closing_gaps: "Closing coverage gaps",
    generating_flashcards: "Creating flashcards",
    building_schedule: "Building study schedule",
    validating: "Validating final interview kit",
    complete: "Interview kit ready",
    failed: "Generation failed",
};

export default function KitDetailPage({ params }: PageProps) {
    const [kitId, setKitId] = useState<string | null>(null);

    const [kit, setKit] = useState<KitResponse["kit"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadKit = useCallback(async (id: string) => {
        try {
            const response = await apiFetch<KitResponse>(
                `/api/kits/${id}`,
            );

            setKit(response.kit);
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load interview kit.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function resolveParams() {
            const resolved = await params;

            if (!cancelled) {
                setKitId(resolved.id);
                await loadKit(resolved.id);
            }
        }

        void resolveParams();

        return () => {
            cancelled = true;
        };
    }, [params, loadKit]);

    useEffect(() => {
        if (!kitId || !kit || kit.status !== "generating") {
            return;
        }

        const interval = window.setInterval(() => {
            void loadKit(kitId);
        }, 2500);

        return () => {
            window.clearInterval(interval);
        };
    }, [kitId, kit, loadKit]);

    if (loading) {
        return <LoadingState />;
    }

    if (error && !kit) {
        return (
            <main className="min-h-screen bg-background">
                <Header />

                <div className="mx-auto max-w-4xl px-6 py-16">
                    <div className="rounded-xl border border-error/20 bg-error-light p-6">
                        <div className="flex gap-3">
                            <CircleAlert
                                size={20}
                                className="mt-0.5 shrink-0 text-error"
                            />

                            <div>
                                <h1 className="text-sm font-semibold text-error">
                                    Unable to load interview kit
                                </h1>

                                <p className="mt-1 text-sm text-error/80">
                                    {error}
                                </p>

                                {kitId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLoading(true);
                                            void loadKit(kitId);
                                        }}
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
                                    >
                                        <RefreshCw size={15} />
                                        Try again
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (!kit) {
        return null;
    }

    if (kit.status === "generating") {
        return <GeneratingView kit={kit} />;
    }

    if (kit.status === "failed") {
        return <FailedView kit={kit} kitId={kitId} loadKit={loadKit} />;
    }

    if (!kit.kit) {
        return (
            <main className="min-h-screen bg-background">
                <Header />

                <div className="mx-auto max-w-4xl px-6 py-16">
                    <div className="rounded-xl border border-border bg-surface p-8 text-center">
                        <CircleAlert
                            size={28}
                            className="mx-auto text-warning"
                        />

                        <h1 className="mt-4 text-lg font-semibold">
                            Interview kit data is unavailable
                        </h1>

                        <p className="mt-2 text-sm text-text-muted">
                            The kit is marked as ready, but no generated
                            content was returned.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <ReadyKitView
            kit={kit.kit}
            kitId={kit.id}
            onKitUpdated={(updatedKit) => {
                setKit((current) =>
                    current
                        ? {
                            ...current,
                            kit: updatedKit,
                        }
                        : current,
                );
            }}
        />
    );
}

function Header() {
    return (
        <header className="border-b border-border bg-background">
            <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
                <Link
                    href="/kits"
                    className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition hover:text-foreground"
                >
                    <ArrowLeft size={16} />
                    Back to interview kits
                </Link>
            </div>
        </header>
    );
}

function GeneratingView({
    kit,
}: {
    kit: NonNullable<KitResponse["kit"]>;
}) {
    const generation = kit.generation;
    const progress = Math.min(
        100,
        Math.max(0, Math.round(generation.progress)),
    );

    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="mx-auto max-w-3xl px-6 py-16">
                <div className="rounded-2xl border border-border bg-background p-8 shadow-sm sm:p-10">
                    <div className="flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                            <Sparkles
                                size={25}
                                className="text-primary"
                            />
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Building your interview kit
                        </h1>

                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
                            We&apos;re researching the company, extracting
                            requirements, generating questions, checking
                            coverage, and building your study plan.
                        </p>
                    </div>

                    <div className="mt-10">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Loader2
                                    size={17}
                                    className="animate-spin text-primary"
                                />

                                <span className="text-sm font-semibold text-foreground">
                                    {STAGE_LABELS[generation.status]}
                                </span>
                            </div>

                            <span className="text-sm font-semibold text-primary">
                                {progress}%
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <ProgressItem
                            active={
                                generation.status ===
                                "researching_company"
                            }
                            done={progress >= 15}
                            label="Company research"
                        />

                        <ProgressItem
                            active={
                                generation.status ===
                                "extracting_requirements"
                            }
                            done={progress >= 30}
                            label="Role requirements"
                        />

                        <ProgressItem
                            active={
                                generation.status ===
                                "generating_questions"
                            }
                            done={progress >= 55}
                            label="Interview questions"
                        />

                        <ProgressItem
                            active={
                                generation.status ===
                                "checking_coverage" ||
                                generation.status === "closing_gaps"
                            }
                            done={progress >= 70}
                            label="Coverage checking"
                        />

                        <ProgressItem
                            active={
                                generation.status ===
                                "generating_flashcards"
                            }
                            done={progress >= 82}
                            label="Flashcards"
                        />

                        <ProgressItem
                            active={
                                generation.status ===
                                "building_schedule"
                            }
                            done={progress >= 92}
                            label="Study schedule"
                        />
                    </div>

                    <div className="mt-8 rounded-lg border border-border bg-surface px-4 py-3">
                        <p className="text-xs leading-5 text-text-muted">
                            You can safely leave this page. Your generation
                            continues on the server, and the kit will be
                            available from your interview kits dashboard.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

function ProgressItem({
    label,
    active,
    done,
}: {
    label: string;
    active: boolean;
    done: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            {done ? (
                <CheckCircle2
                    size={17}
                    className="shrink-0 text-primary"
                />
            ) : active ? (
                <Loader2
                    size={17}
                    className="shrink-0 animate-spin text-primary"
                />
            ) : (
                <div className="h-4 w-4 shrink-0 rounded-full border border-border-strong" />
            )}

            <span
                className={`text-sm ${active || done
                    ? "font-medium text-foreground"
                    : "text-text-muted"
                    }`}
            >
                {label}
            </span>
        </div>
    );
}

function FailedView({
    kit,
    kitId,
    loadKit,
}: {
    kit: NonNullable<KitResponse["kit"]>;
    kitId: string | null;
    loadKit: (id: string) => Promise<void>;
}) {
    const [retrying, setRetrying] = useState(false);

    async function retry() {
        if (!kitId) {
            return;
        }

        setRetrying(true);

        try {
            /*
             * The backend currently retries failed kits when the same
             * source is submitted again. Redirecting to the new-kit page
             * keeps the retry flow simple for now.
             */
            window.location.href = "/kits/new";
        } finally {
            setRetrying(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="mx-auto max-w-3xl px-6 py-16">
                <div className="rounded-2xl border border-error/20 bg-error-light p-8 sm:p-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                        <CircleAlert
                            size={24}
                            className="text-error"
                        />
                    </div>

                    <h1 className="mt-5 text-2xl font-bold text-foreground">
                        We couldn&apos;t generate this interview kit
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-text-muted">
                        Something went wrong while processing the company or
                        job description. Your account and other interview kits
                        are unaffected.
                    </p>

                    {kit.generation.error?.message && (
                        <div className="mt-5 rounded-lg border border-error/20 bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-error">
                                Generation error
                            </p>

                            <p className="mt-1 text-sm text-text-muted">
                                {kit.generation.error.message}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={retry}
                            disabled={retrying}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed"
                        >
                            {retrying ? (
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <RefreshCw size={16} />
                            )}
                            Try again
                        </button>

                        {kitId && (
                            <button
                                type="button"
                                onClick={() => void loadKit(kitId)}
                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-surface"
                            >
                                Refresh status
                            </button>
                        )}

                        <Link
                            href="/kits"
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-surface"
                        >
                            Back to kits
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

function ReadyKitView({
    kit,
    kitId,
    onKitUpdated,
}: {
    kit: InterviewKit;
    kitId: string;
    onKitUpdated: (kit: InterviewKit) => void;
}) {
    const mustRequirements = kit.role.requirements.filter(
        (requirement) => requirement.priority === "must",
    );

    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Hero */}
                <section className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                                <CheckCircle2 size={14} />
                                Interview kit ready
                            </div>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                                {kit.role.title || "Interview preparation kit"}
                            </h1>

                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
                                {kit.source.company && (
                                    <span className="inline-flex items-center gap-2">
                                        <BriefcaseBusiness size={15} />
                                        {kit.source.company}
                                    </span>
                                )}

                                {kit.role.seniority && (
                                    <span>
                                        {kit.role.seniority}
                                    </span>
                                )}

                                {kit.source.location && (
                                    <span>
                                        {kit.source.location}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Stat
                                icon={<Target size={16} />}
                                value={mustRequirements.length}
                                label="Must-have"
                            />

                            <Stat
                                icon={<FileText size={16} />}
                                value={kit.questions.length}
                                label="Questions"
                            />

                            <Stat
                                icon={<BookOpen size={16} />}
                                value={kit.flashcards.length}
                                label="Flashcards"
                            />

                            <Stat
                                icon={<CalendarDays size={16} />}
                                value={kit.schedule.days_available}
                                label="Study days"
                            />
                        </div>
                    </div>
                </section>

                {/* Company brief */}
                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                    <ContentCard
                        icon={<BriefcaseBusiness size={19} />}
                        title="Company brief"
                    >
                        <p className="text-sm leading-6 text-text-muted">
                            {kit.company_brief.summary}
                        </p>
                    </ContentCard>

                    <ContentCard
                        icon={<Sparkles size={19} />}
                        title="What they do"
                    >
                        <p className="text-sm leading-6 text-text-muted">
                            {kit.company_brief.what_they_do}
                        </p>
                    </ContentCard>
                </section>

                {/* Responsibilities */}
                <section className="mt-6">
                    <ContentCard
                        icon={<BriefcaseBusiness size={19} />}
                        title="Role responsibilities"
                    >
                        <ul className="space-y-3">
                            {kit.role.responsibilities.map(
                                (responsibility, index) => (
                                    <li
                                        key={`${responsibility}-${index}`}
                                        className="flex items-start gap-3 text-sm leading-6 text-text-muted"
                                    >
                                        <CheckCircle2
                                            size={17}
                                            className="mt-1 shrink-0 text-primary"
                                        />

                                        <span>
                                            {responsibility}
                                        </span>
                                    </li>
                                ),
                            )}
                        </ul>
                    </ContentCard>
                </section>

                {/* Requirements */}
                <section className="mt-6">
                    <ContentCard
                        icon={<Target size={19} />}
                        title="Requirements"
                    >
                        <div className="space-y-3">
                            {kit.role.requirements.map(
                                (requirement) => (
                                    <div
                                        key={requirement.id}
                                        className="rounded-lg border border-border bg-surface p-4"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <p className="text-sm font-medium leading-6 text-foreground">
                                                {requirement.text}
                                            </p>

                                            <div className="flex shrink-0 gap-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${requirement.priority ===
                                                        "must"
                                                        ? "bg-primary-light text-primary"
                                                        : "bg-background text-text-muted"
                                                        }`}
                                                >
                                                    {requirement.priority ===
                                                        "must"
                                                        ? "Must-have"
                                                        : "Nice-to-have"}
                                                </span>

                                                <span className="rounded-full bg-background px-2.5 py-1 text-xs text-text-muted">
                                                    {requirement.kind}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </ContentCard>
                </section>

                <RegenerateControls
                    kitId={kitId}
                    onRegenerated={onKitUpdated}
                />

                <QuestionEditor
                    kitId={kitId}
                    initialQuestions={kit.questions}
                />

                <FlashcardEditor
                    kitId={kitId}
                    initialFlashcards={
                        kit.flashcards
                    }
                    requirements={
                        kit.role.requirements
                    }
                />

                <FlashcardPractice
                    kitId={kitId}
                    flashcards={kit.flashcards}
                />

                <section className="mt-6">
                    <ContentCard
                        icon={<CalendarDays size={19} />}
                        title="Study schedule"
                    >
                        <div className="space-y-3">
                            {kit.schedule.days.map((day) => (
                                <div
                                    key={day.day}
                                    className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-sm font-bold text-primary">
                                        {day.day}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-foreground">
                                            Day {day.day}
                                        </p>

                                        <p className="mt-1 text-sm text-text-muted">
                                            {day.focus}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-4 text-xs text-text-muted">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock3 size={14} />
                                            {day.minutes} min
                                        </span>

                                        <span>
                                            {day.question_ids.length}{" "}
                                            questions
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ContentCard>
                </section>

                {/* Coverage */}
                <section className="mt-6">
                    <div className="rounded-xl border border-primary/20 bg-primary-light p-6">
                        <div className="flex gap-3">
                            <CheckCircle2
                                size={20}
                                className="mt-0.5 shrink-0 text-primary"
                            />

                            <div>
                                <h2 className="text-sm font-semibold text-primary">
                                    Requirement coverage complete
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-primary/80">
                                    All must-have requirements are covered by
                                    the generated question bank.
                                    {kit.coverage.passes > 0 &&
                                        ` The coverage checker used ${kit.coverage.passes} ${kit.coverage.passes === 1
                                            ? "pass"
                                            : "passes"
                                        }.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function ContentCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                    {icon}
                </div>

                <h2 className="text-base font-semibold text-foreground">
                    {title}
                </h2>
            </div>

            {children}
        </div>
    );
}

function Stat({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
}) {
    return (
        <div className="rounded-lg border border-border bg-surface px-3 py-3">
            <div className="flex items-center gap-1.5 text-primary">
                {icon}

                <span className="text-lg font-bold text-foreground">
                    {value}
                </span>
            </div>

            <p className="mt-1 text-[11px] text-text-muted">
                {label}
            </p>
        </div>
    );
}

function LoadingState() {
    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="mx-auto max-w-4xl px-6 py-16">
                <div className="animate-pulse space-y-5">
                    <div className="h-8 w-2/3 rounded-lg bg-surface" />
                    <div className="h-4 w-1/2 rounded bg-surface" />

                    <div className="mt-8 h-40 rounded-xl bg-surface" />
                    <div className="h-48 rounded-xl bg-surface" />
                    <div className="h-64 rounded-xl bg-surface" />
                </div>
            </div>
        </main>
    );
}
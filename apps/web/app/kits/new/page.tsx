"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Globe,
    Info,
    Loader2,
    Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CreateKitResponse {
    id: string;
    status: "generating" | "ready" | "failed";
    reused?: boolean;
    retried?: boolean;
}

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 100_000;

export default function NewKitPage() {
    const [jd, setJd] = useState("");
    const [companyUrl, setCompanyUrl] = useState("");
    const [daysAvailable, setDaysAvailable] = useState("5");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const jdLength = jd.trim().length;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");

        const cleanJd = jd.trim();
        const cleanUrl = companyUrl.trim();

        if (cleanJd.length < MIN_JD_LENGTH) {
            setError(
                `Job description must contain at least ${MIN_JD_LENGTH} characters.`,
            );
            return;
        }

        if (cleanJd.length > MAX_JD_LENGTH) {
            setError(
                `Job description cannot exceed ${MAX_JD_LENGTH.toLocaleString()} characters.`,
            );
            return;
        }

        if (!isValidHttpUrl(cleanUrl)) {
            setError(
                "Enter a valid company website URL starting with http:// or https://.",
            );
            return;
        }

        const days = Number(daysAvailable);

        if (
            !Number.isInteger(days) ||
            days < 1 ||
            days > 60
        ) {
            setError("Study period must be between 1 and 60 days.");
            return;
        }

        setLoading(true);

        try {
            const response = await apiFetch<CreateKitResponse>(
                "/api/kits",
                {
                    method: "POST",
                    body: JSON.stringify({
                        jd: cleanJd,
                        company_url: cleanUrl,
                        days_available: days,
                    }),
                },
            );

            if (!response.id) {
                throw new Error(
                    "The server did not return a valid interview kit.",
                );
            }

            window.location.href = `/kits/${response.id}`;
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create your interview kit.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            {/* Header */}
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

            <div className="mx-auto w-full max-w-4xl px-6 py-10">
                {/* Page heading */}
                <div className="mb-8">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                        <Sparkles size={14} />
                        AI Interview Prep
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Create an interview kit
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                        Give us the job description, company website, and
                        time available. We&apos;ll build a preparation plan
                        around the role.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-xl border border-border bg-background p-6"
                    >
                        {error && (
                            <div
                                role="alert"
                                className="mb-6 flex gap-3 rounded-lg border border-error/20 bg-error-light px-4 py-3"
                            >
                                <Info
                                    size={18}
                                    className="mt-0.5 shrink-0 text-error"
                                />

                                <p className="text-sm leading-5 text-error">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Job description */}
                        <div>
                            <div className="mb-2 flex items-center justify-between gap-4">
                                <label
                                    htmlFor="job-description"
                                    className="text-sm font-semibold text-foreground"
                                >
                                    Job description
                                </label>

                                <span
                                    className={`text-xs ${jdLength > MAX_JD_LENGTH
                                            ? "text-error"
                                            : "text-text-subtle"
                                        }`}
                                >
                                    {jdLength.toLocaleString()} /{" "}
                                    {MAX_JD_LENGTH.toLocaleString()}
                                </span>
                            </div>

                            <textarea
                                id="job-description"
                                value={jd}
                                onChange={(event) =>
                                    setJd(event.target.value)
                                }
                                placeholder={`Paste the complete job description here...

For example:
• Responsibilities
• Required skills
• Experience requirements
• Education
• Preferred qualifications
• Technical requirements`}
                                rows={15}
                                required
                                maxLength={MAX_JD_LENGTH}
                                className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground transition placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                            />

                            <p className="mt-2 text-xs text-text-subtle">
                                Include the full job description so the
                                requirement coverage check can identify every
                                important requirement.
                            </p>
                        </div>

                        {/* Company URL */}
                        <div className="mt-6">
                            <label
                                htmlFor="company-url"
                                className="mb-2 block text-sm font-semibold text-foreground"
                            >
                                Company website
                            </label>

                            <div className="relative">
                                <Globe
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
                                />

                                <input
                                    id="company-url"
                                    type="url"
                                    value={companyUrl}
                                    onChange={(event) =>
                                        setCompanyUrl(event.target.value)
                                    }
                                    placeholder="https://example.com"
                                    autoComplete="url"
                                    required
                                    className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground transition placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <p className="mt-2 text-xs text-text-subtle">
                                We&apos;ll research the company website and
                                relevant hiring or engineering pages.
                            </p>
                        </div>

                        {/* Days */}
                        <div className="mt-6">
                            <label
                                htmlFor="days-available"
                                className="mb-2 block text-sm font-semibold text-foreground"
                            >
                                Days until interview
                            </label>

                            <div className="flex items-center gap-3">
                                <select
                                    id="days-available"
                                    value={daysAvailable}
                                    onChange={(event) =>
                                        setDaysAvailable(
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary sm:w-48"
                                >
                                    {Array.from(
                                        { length: 60 },
                                        (_, index) => index + 1,
                                    ).map((day) => (
                                        <option
                                            key={day}
                                            value={day}
                                        >
                                            {day}{" "}
                                            {day === 1
                                                ? "day"
                                                : "days"}
                                        </option>
                                    ))}
                                </select>

                                <span className="text-sm text-text-muted">
                                    We&apos;ll distribute the preparation
                                    across these days.
                                </span>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="mt-8 border-t border-border pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed sm:w-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                        Starting preparation...
                                    </>
                                ) : (
                                    <>
                                        Generate interview kit
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Side information */}
                    <aside className="space-y-4">
                        <div className="rounded-xl border border-border bg-surface p-5">
                            <h2 className="text-sm font-semibold text-foreground">
                                What you&apos;ll get
                            </h2>

                            <ul className="mt-4 space-y-3">
                                <Feature>
                                    Company research
                                </Feature>

                                <Feature>
                                    Role and requirement breakdown
                                </Feature>

                                <Feature>
                                    Categorized interview questions
                                </Feature>

                                <Feature>
                                    Targeted flashcards
                                </Feature>

                                <Feature>
                                    Day-by-day study schedule
                                </Feature>

                                <Feature>
                                    Requirement coverage checking
                                </Feature>
                            </ul>
                        </div>

                        <div className="rounded-xl border border-primary/20 bg-primary-light p-5">
                            <div className="flex gap-3">
                                <CheckCircle2
                                    size={18}
                                    className="mt-0.5 shrink-0 text-primary"
                                />

                                <div>
                                    <h2 className="text-sm font-semibold text-primary">
                                        Your edits are preserved
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 text-primary/80">
                                        Generated content can be edited later.
                                        Regenerating one section won&apos;t
                                        overwrite your other changes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function Feature({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <li className="flex items-start gap-2.5 text-sm text-text-muted">
            <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-primary"
            />

            <span>{children}</span>
        </li>
    );
}

function isValidHttpUrl(value: string) {
    try {
        const url = new URL(value);

        return (
            (url.protocol === "http:" ||
                url.protocol === "https:") &&
            Boolean(url.hostname)
        );
    } catch {
        return false;
    }
}
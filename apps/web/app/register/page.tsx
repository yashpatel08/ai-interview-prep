"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
    ArrowRight,
    Lock,
    Mail,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AuthResponse {
    user: {
        id: string;
        email: string;
    };
}

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await apiFetch<AuthResponse>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            window.location.href = "/login";
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create account",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="flex min-h-screen">

                {/* Branding */}
                <div className="hidden w-1/2 bg-surface lg:flex">
                    <div className="flex w-full flex-col justify-between p-12">
                        <Link
                            href="/"
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-white">
                                AI
                            </div>

                            <span className="text-lg font-semibold tracking-tight text-foreground">
                                Interview Prep
                            </span>
                        </Link>

                        <div className="max-w-lg">
                            <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-sm font-medium text-primary">
                                Start preparing today
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight text-foreground xl:text-5xl">
                                Build your
                                <br />
                                interview advantage.
                            </h1>

                            <p className="mt-5 max-w-md text-base leading-7 text-text-muted">
                                Organize preparation for multiple roles,
                                practice targeted questions, review
                                flashcards, and follow a structured study
                                schedule.
                            </p>
                        </div>

                        <p className="text-sm text-text-subtle">
                            Built for focused interview preparation
                        </p>
                    </div>
                </div>

                {/* Registration */}
                <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
                    <div className="w-full max-w-md">

                        <div className="mb-8 lg:hidden">
                            <Link
                                href="/"
                                className="flex items-center gap-3"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-white">
                                    AI
                                </div>

                                <span className="text-lg font-semibold text-foreground">
                                    Interview Prep
                                </span>
                            </Link>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                Create your account
                            </h2>

                            <p className="mt-2 text-sm text-text-muted">
                                Start building personalized interview
                                preparation kits.
                            </p>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="mb-5 rounded-lg border border-error/20 bg-error-light px-4 py-3 text-sm text-error"
                            >
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-foreground"
                                >
                                    Email
                                </label>

                                <div className="relative">
                                    <Mail
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
                                    />

                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        required
                                        className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground transition focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-foreground"
                                >
                                    Password
                                </label>

                                <div className="relative">
                                    <Lock
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
                                    />

                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        required
                                        className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground transition focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="mb-2 block text-sm font-medium text-foreground"
                                >
                                    Confirm password
                                </label>

                                <div className="relative">
                                    <Lock
                                        size={18}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
                                    />

                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Repeat your password"
                                        autoComplete="new-password"
                                        required
                                        className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground transition focus:border-primary"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
                            >
                                {loading ? (
                                    "Creating account..."
                                ) : (
                                    <>
                                        Create account
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-7 text-center text-sm text-text-muted">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-primary hover:text-primary-hover"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
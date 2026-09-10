"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AuthResponse {
    user: {
        id: string;
        email: string;
    };
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await apiFetch<AuthResponse>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            window.location.href = "/kits";
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to sign in",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="flex min-h-screen">

                {/* Left branding panel */}
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
                                AI Interview Prep Kit
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight text-foreground xl:text-5xl">
                                Prepare smarter.
                                <br />
                                Interview with confidence.
                            </h1>

                            <p className="mt-5 max-w-md text-base leading-7 text-text-muted">
                                Turn a job description into a focused
                                preparation plan with company research,
                                interview questions, flashcards, and a
                                personalized study schedule.
                            </p>
                        </div>

                        <p className="text-sm text-text-subtle">
                            Your preparation workspace
                        </p>
                    </div>
                </div>

                {/* Form */}
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
                                Welcome back
                            </h2>

                            <p className="mt-2 text-sm text-text-muted">
                                Sign in to continue your interview
                                preparation.
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
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
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
                                    "Signing in..."
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-7 text-center text-sm text-text-muted">
                            Don't have an account?{" "}
                            <Link
                                href="/register"
                                className="font-semibold text-primary hover:text-primary-hover"
                            >
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
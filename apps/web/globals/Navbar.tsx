"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface User {
    id: string;
    email: string;
}

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        apiFetch<User>("/api/auth/me")
            .then((data) => {
                if (mounted) {
                    setUser(data);
                }
            })
            .catch(() => {
                if (mounted) {
                    setUser(null);
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                        AI
                    </div>

                    <span className="text-lg font-semibold tracking-tight text-gray-900">
                        Interview Prep
                    </span>
                </Link>

                <nav className="flex items-center gap-3">
                    {loading ? (
                        <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
                    ) : user ? (
                        <Link
                            href="/kits"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                        >
                            Kits
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                            >
                                Sign in
                            </Link>

                            <Link
                                href="/register"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                            >
                                Get started
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
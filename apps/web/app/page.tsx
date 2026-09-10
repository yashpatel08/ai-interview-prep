import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import Navbar from "@/globals/Navbar";
import PageContainer from "@/globals/PageContainer";

const features = [
    "Research the company and hiring process",
    "Extract requirements directly from the job description",
    "Generate technical, behavioral, and system-design questions",
    "Create flashcards focused on your role",
    "Build a day-by-day preparation schedule",
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <PageContainer>
                <section className="relative flex min-h-[620px] flex-col items-center justify-center py-20 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                        <Sparkles className="h-4 w-4" />
                        AI-powered interview preparation
                    </div>

                    <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Prepare smarter.
                        <span className="block text-primary">
                            Interview with confidence.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                        Turn any job description into a focused interview
                        preparation kit with company research, targeted
                        questions, flashcards, and a personalized study plan.
                    </p>

                    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/kits/new"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            Create Interview Kit
                            <ArrowRight className="h-4 w-4" />
                        </Link>

                        <Link
                            href="#how-it-works"
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            How it works
                        </Link>
                    </div>
                </section>

                {/* How it works */}
                <section
                    id="how-it-works"
                    className="border-t border-gray-100 py-20"
                >
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                            How it works
                        </p>

                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                            Everything you need in one preparation kit
                        </h2>

                        <p className="mt-4 text-gray-600">
                            Give us the job description, company website, and
                            the time you have before your interview.
                        </p>
                    </div>

                    <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
                        <FeatureCard
                            number="01"
                            title="Research"
                            description="Analyze the company website and publicly available interview information."
                        />

                        <FeatureCard
                            number="02"
                            title="Prepare"
                            description="Generate targeted questions and flashcards based on the actual role requirements."
                        />

                        <FeatureCard
                            number="03"
                            title="Practice"
                            description="Follow a deterministic study schedule designed around the days you have available."
                        />
                    </div>
                </section>

                {/* Features */}
                <section className="border-t border-gray-100 py-20">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                                Built for focused preparation
                            </p>

                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                                From job description to interview-ready
                            </h2>

                            <p className="mt-5 leading-7 text-gray-600">
                                The application combines research, structured
                                generation, requirement coverage, and
                                deterministic scheduling instead of relying on
                                one large AI response.
                            </p>

                            <Link
                                href="/kits/new"
                                className="mt-7 inline-flex items-center gap-2 font-semibold text-primary hover:text-indigo-700"
                            >
                                Build your preparation kit
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7">
                            <div className="space-y-4">
                                {features.map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-start gap-3"
                                    >
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                                        <span className="text-sm leading-6 text-gray-700">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20">
                    <div className="rounded-3xl bg-primary px-6 py-14 text-center sm:px-12">
                        <h2 className="text-3xl font-bold tracking-tight text-white">
                            Your next interview starts here.
                        </h2>

                        <p className="mx-auto mt-4 max-w-xl text-indigo-100">
                            Build a preparation plan around the role you
                            actually want.
                        </p>

                        <Link
                            href="/kits/new"
                            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                            Create Interview Kit
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </PageContainer>

            <footer className="border-t border-gray-200">
                <PageContainer className="flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} AI Interview Prep Kit
                    </p>

                    <p className="text-sm text-gray-400">
                        Prepare with purpose.
                    </p>
                </PageContainer>
            </footer>
        </div>
    );
}

interface FeatureCardProps {
    number: string;
    title: string;
    description: string;
}

function FeatureCard({
    number,
    title,
    description,
}: FeatureCardProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-bold text-primary">
                {number}
            </span>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
                {description}
            </p>
        </div>
    );
}
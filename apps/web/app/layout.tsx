import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "AI Interview Prep Kit",
        template: "%s | AI Interview Prep Kit",
    },
    description:
        "Turn a job description into a personalized interview preparation kit with company research, questions, flashcards, and a study schedule.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
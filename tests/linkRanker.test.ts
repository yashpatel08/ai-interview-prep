import { describe, expect, it } from "vitest";

import { rankLinks } from "../apps/api/src/services/retrieval/linkRanker.js";

describe("rankLinks", () => {
    it("prioritizes careers and hiring pages", () => {
        const result = rankLinks(
            [
                {
                    href: "https://acme.com/about",
                    text: "About",
                },
                {
                    href: "https://acme.com/careers",
                    text: "Careers",
                },
                {
                    href: "https://acme.com/privacy",
                    text: "Privacy",
                },
            ],
            "https://acme.com",
        );

        expect(result[0]?.href).toBe(
            "https://acme.com/careers",
        );
    });

    it("prioritizes engineering pages", () => {
        const result = rankLinks(
            [
                {
                    href: "https://acme.com/team",
                    text: "Our Team",
                },
                {
                    href: "https://acme.com/engineering",
                    text: "Engineering",
                },
            ],
            "https://acme.com",
        );

        expect(result[0]?.href).toBe(
            "https://acme.com/engineering",
        );
    });

    it("ignores external domains", () => {
        const result = rankLinks(
            [
                {
                    href: "https://acme.com/careers",
                    text: "Careers",
                },
                {
                    href: "https://linkedin.com/company/acme",
                    text: "LinkedIn",
                },
            ],
            "https://acme.com",
        );

        expect(result).toHaveLength(1);
        expect(result[0]?.href).toBe(
            "https://acme.com/careers",
        );
    });

    it("penalizes privacy pages", () => {
        const result = rankLinks(
            [
                {
                    href: "https://acme.com/privacy",
                    text: "Privacy Policy",
                },
                {
                    href: "https://acme.com/jobs",
                    text: "Jobs",
                },
            ],
            "https://acme.com",
        );

        expect(result[0]?.href).toBe(
            "https://acme.com/jobs",
        );
    });
});
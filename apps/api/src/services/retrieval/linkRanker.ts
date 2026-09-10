import type { ExtractedLink } from "./pageExtractor.js";

export interface RankedLink {
    href: string;
    text: string;
    score: number;
    reasons: string[];
}

const HIGH_VALUE_TERMS = [
    "career",
    "careers",
    "jobs",
    "job",
    "hiring",
    "hire",
    "recruit",
    "recruiting",
    "interview",
    "work-with-us",
    "work with us",
    "join-us",
    "join us",
];

const COMPANY_TERMS = [
    "about",
    "company",
    "mission",
    "values",
    "culture",
    "team",
];

const ENGINEERING_TERMS = [
    "engineering",
    "technology",
    "technologies",
    "tech",
    "developer",
    "developers",
    "software",
    "product",
];

const NEGATIVE_TERMS = [
    "privacy",
    "cookie",
    "terms",
    "login",
    "signin",
    "sign-in",
    "cart",
    "checkout",
];

function scoreText(
    value: string,
    terms: string[],
    weight: number,
): {
    score: number;
    reasons: string[];
} {
    const normalized = value.toLowerCase();

    let score = 0;
    const reasons: string[] = [];

    for (const term of terms) {
        if (normalized.includes(term)) {
            score += weight;
            reasons.push(term);
        }
    }

    return {
        score,
        reasons,
    };
}

export function rankLinks(
    links: ExtractedLink[],
    baseUrl: string,
): RankedLink[] {
    const base = new URL(baseUrl);

    return links
        .map((link) => {
            let url: URL;

            try {
                url = new URL(link.href, base);
            } catch {
                return null;
            }

            /*
             * Research should stay within the supplied company host.
             */
            if (url.hostname !== base.hostname) {
                return null;
            }

            const searchableText = [
                link.text,
                url.pathname,
                url.search,
            ].join(" ");

            let score = 0;
            const reasons: string[] = [];

            const highValue = scoreText(
                searchableText,
                HIGH_VALUE_TERMS,
                10,
            );

            score += highValue.score;
            reasons.push(...highValue.reasons);

            const company = scoreText(
                searchableText,
                COMPANY_TERMS,
                4,
            );

            score += company.score;
            reasons.push(...company.reasons);

            const engineering = scoreText(
                searchableText,
                ENGINEERING_TERMS,
                4,
            );

            score += engineering.score;
            reasons.push(...engineering.reasons);

            const negative = scoreText(
                searchableText,
                NEGATIVE_TERMS,
                -10,
            );

            score += negative.score;

            if (negative.reasons.length > 0) {
                reasons.push(
                    ...negative.reasons.map(
                        (reason) => `negative:${reason}`,
                    ),
                );
            }

            /*
             * Deeper paths are slightly less desirable because
             * they are usually more specific/less useful landing pages.
             */
            const depth = url.pathname
                .split("/")
                .filter(Boolean).length;

            score -= Math.max(0, depth - 2);

            return {
                href: url.toString(),
                text: link.text,
                score,
                reasons,
            };
        })
        .filter(
            (link): link is RankedLink =>
                link !== null,
        )
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return a.href.localeCompare(b.href);
        });
}
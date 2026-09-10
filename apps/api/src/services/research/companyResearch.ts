import {
    crawlCompany,
    type RankedLink,
} from "../retrieval/index.js";

import type {
    CompanyResearch,
    ResearchContext,
} from "./types.js";

function uniqueUrls(urls: string[]): string[] {
    return [...new Set(urls)];
}

function classifyLink(link: RankedLink): {
    hiring: boolean;
    company: boolean;
    engineering: boolean;
} {
    const value = `${link.href} ${link.text}`.toLowerCase();

    return {
        hiring:
            /\b(career|careers|jobs|job|hiring|hire|recruit|recruiting|interview|work-with-us|join-us)\b/.test(
                value,
            ),
        company:
            /\b(about|company|mission|values|culture|team)\b/.test(value),
        engineering:
            /\b(engineering|technology|technologies|tech|developer|developers|software|product)\b/.test(
                value,
            ),
    };
}

export async function researchCompany(
    companyUrl: string,
): Promise<CompanyResearch> {
    const result = await crawlCompany(companyUrl);

    const hiringPages: string[] = [];
    const companyPages: string[] = [];
    const engineeringPages: string[] = [];

    for (const link of result.rankedLinks) {
        const classification = classifyLink(link);

        if (classification.hiring) {
            hiringPages.push(link.href);
        }

        if (classification.company) {
            companyPages.push(link.href);
        }

        if (classification.engineering) {
            engineeringPages.push(link.href);
        }
    }

    const pagesUsed = uniqueUrls([
        ...hiringPages,
        ...companyPages,
        ...engineeringPages,
        ...result.pages.map((page) => page.url),
    ]).slice(0, 8);

    return {
        companyUrl,
        pages: result.pages,
        pagesUsed,
        hiringPages: uniqueUrls(hiringPages),
        companyPages: uniqueUrls(companyPages),
        engineeringPages: uniqueUrls(engineeringPages),
        errors: result.errors,
    };
}

export function buildResearchContext(
    research: CompanyResearch,
): ResearchContext {
    const selectedPages = research.pages.filter((page) =>
        research.pagesUsed.includes(page.url),
    );

    return {
        companyUrl: research.companyUrl,
        pages: selectedPages.map((page) => ({
            url: page.url,
            title: page.title,
            text: page.text.slice(0, 12_000),
        })),
        sourceUrls: selectedPages.map((page) => page.url),
    };
}
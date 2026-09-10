import { extractPage, type ExtractedPage } from "./pageExtractor.js";
import { createRobotsChecker } from "./robots.js";
import {
    rankLinks,
    type RankedLink,
} from "./linkRanker.js";
import { validateExternalUrl } from "./urlSafety.js";

const MAX_PAGES = 8;
const MAX_DEPTH = 2;
const MAX_HTML_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 10_000;

export interface CrawlResult {
    pages: ExtractedPage[];
    rankedLinks: RankedLink[];
    errors: Array<{
        url: string;
        message: string;
    }>;
}

async function fetchHtml(
    url: string,
): Promise<string> {
    await validateExternalUrl(url);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            redirect: "follow",
            headers: {
                Accept:
                    "text/html,application/xhtml+xml",
                "User-Agent":
                    "AI-Interview-Prep-ResearchBot/1.0",
            },
        });

        if (!response.ok) {
            throw new Error(
                `HTTP_${response.status}`,
            );
        }

        const contentType =
            response.headers.get("content-type") ?? "";

        if (
            !contentType.includes("text/html") &&
            !contentType.includes("application/xhtml+xml")
        ) {
            throw new Error("NOT_HTML");
        }

        const contentLength =
            response.headers.get("content-length");

        if (
            contentLength &&
            Number(contentLength) > MAX_HTML_BYTES
        ) {
            throw new Error("PAGE_TOO_LARGE");
        }

        const buffer = await response.arrayBuffer();

        if (buffer.byteLength > MAX_HTML_BYTES) {
            throw new Error("PAGE_TOO_LARGE");
        }

        return new TextDecoder().decode(buffer);
    } finally {
        clearTimeout(timeout);
    }
}

export async function crawlCompany(
    companyUrl: string,
): Promise<CrawlResult> {
    const startUrl =
        await validateExternalUrl(companyUrl);
    const canFetch = await createRobotsChecker(
        companyUrl,
    );
    const pages: ExtractedPage[] = [];
    const errors: CrawlResult["errors"] = [];

    const visited = new Set<string>();

    const queue: Array<{
        url: string;
        depth: number;
    }> = [
            {
                url: startUrl.toString(),
                depth: 0,
            },
        ];

    let allRankedLinks: RankedLink[] = [];

    while (
        queue.length > 0 &&
        pages.length < MAX_PAGES
    ) {
        const current = queue.shift();

        if (!current) {
            break;
        }

        const normalizedUrl = normalizeUrl(
            current.url,
        );

        if (visited.has(normalizedUrl)) {
            continue;
        }

        visited.add(normalizedUrl);

        try {
            if (!canFetch(current.url)) {
                errors.push({
                    url: current.url,
                    message: "BLOCKED_BY_ROBOTS",
                });

                continue;
            }

            const html = await fetchHtml(
                current.url,
            );

            const page = extractPage(
                html,
                current.url,
            );

            pages.push(page);

            const ranked = rankLinks(
                page.links,
                startUrl.toString(),
            );

            allRankedLinks = mergeRankedLinks(
                allRankedLinks,
                ranked,
            );

            if (current.depth >= MAX_DEPTH) {
                continue;
            }

            /*
             * Only queue promising links.
             */
            for (const link of ranked.slice(0, 6)) {
                if (pages.length + queue.length >= MAX_PAGES) {
                    break;
                }

                if (!visited.has(normalizeUrl(link.href))) {
                    queue.push({
                        url: link.href,
                        depth: current.depth + 1,
                    });
                }
            }
        } catch (error) {
            errors.push({
                url: current.url,
                message:
                    error instanceof Error
                        ? error.message
                        : "UNKNOWN_ERROR",
            });
        }
    }

    return {
        pages,
        rankedLinks: allRankedLinks,
        errors,
    };
}

function normalizeUrl(
    input: string,
): string {
    const url = new URL(input);

    url.hash = "";

    if (url.pathname !== "/") {
        url.pathname = url.pathname.replace(
            /\/+$/,
            "",
        );
    }

    return url.toString();
}

function mergeRankedLinks(
    existing: RankedLink[],
    incoming: RankedLink[],
): RankedLink[] {
    const map = new Map<
        string,
        RankedLink
    >();

    for (const link of existing) {
        map.set(normalizeUrl(link.href), link);
    }

    for (const link of incoming) {
        const key = normalizeUrl(link.href);
        const previous = map.get(key);

        if (!previous || link.score > previous.score) {
            map.set(key, link);
        }
    }

    return [...map.values()].sort(
        (a, b) => b.score - a.score,
    );
}
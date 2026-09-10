import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const robotsParser = require("robots-parser") as (
    url: string,
    robotsTxt: string,
) => {
    isAllowed(
        targetUrl: string,
        userAgent?: string,
    ): boolean | undefined;
};

const USER_AGENT =
    "AI-Interview-Prep-ResearchBot/1.0";

const timeoutMs = 5_000;

export async function createRobotsChecker(
    companyUrl: string,
): Promise<(targetUrl: string) => boolean> {
    const url = new URL(companyUrl);

    const robotsUrl = new URL(
        "/robots.txt",
        url.origin,
    );

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch(
            robotsUrl.toString(),
            {
                signal: controller.signal,
                headers: {
                    "User-Agent": USER_AGENT,
                },
            },
        );

        if (!response.ok) {
            return () => true;
        }

        const content = await response.text();

        const robots = robotsParser(
            robotsUrl.toString(),
            content,
        );

        return (targetUrl: string) =>
            robots.isAllowed(
                targetUrl,
                USER_AGENT,
            ) !== false;
    } catch {
        return () => true;
    } finally {
        clearTimeout(timeout);
    }
}
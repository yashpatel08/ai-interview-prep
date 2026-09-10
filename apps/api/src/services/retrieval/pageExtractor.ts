import * as cheerio from "cheerio";

export interface ExtractedLink {
    href: string;
    text: string;
}

export interface ExtractedPage {
    url: string;
    title: string;
    description: string;
    text: string;
    links: ExtractedLink[];
}

export function extractPage(
    html: string,
    url: string,
): ExtractedPage {
    const $ = cheerio.load(html);

    const title = $("title")
        .first()
        .text()
        .trim();

    const description = $(
        'meta[name="description"]',
    )
        .attr("content")
        ?.trim() ?? "";

    /*
     * Remove elements that normally contain navigation,
     * scripts or non-content data.
     */
    $(
        "script, style, noscript, svg, iframe, canvas",
    ).remove();

    const text = $("body")
        .text()
        .replace(/\s+/g, " ")
        .trim();

    const links: ExtractedLink[] = [];

    $("a[href]").each((_, element) => {
        const rawHref = $(element)
            .attr("href")
            ?.trim();

        if (!rawHref) {
            return;
        }

        try {
            const absoluteUrl = new URL(
                rawHref,
                url,
            );

            if (
                !["http:", "https:"].includes(
                    absoluteUrl.protocol,
                )
            ) {
                return;
            }

            links.push({
                href: absoluteUrl.toString(),
                text: $(element)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim(),
            });
        } catch {
            // Ignore malformed links.
        }
    });

    return {
        url,
        title,
        description,
        text,
        links,
    };
}
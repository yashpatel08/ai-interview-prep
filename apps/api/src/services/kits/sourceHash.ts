import crypto from "node:crypto";

export function normalizeCompanyUrl(url: string): string {
    return url
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "");
}

export function normalizeJobDescription(jd: string): string {
    return jd
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

export function createSourceHash(
    jd: string,
    companyUrl: string,
): string {
    const normalized = [
        normalizeJobDescription(jd),
        normalizeCompanyUrl(companyUrl),
    ].join("|");

    return crypto
        .createHash("sha256")
        .update(normalized)
        .digest("hex");
}
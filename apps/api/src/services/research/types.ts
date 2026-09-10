import type { ExtractedPage } from "../retrieval/index.js";

export interface CompanyResearch {
    companyUrl: string;
    pages: ExtractedPage[];
    pagesUsed: string[];
    hiringPages: string[];
    companyPages: string[];
    engineeringPages: string[];
    errors: Array<{
        url: string;
        message: string;
    }>;
}

export interface ResearchContext {
    companyUrl: string;
    pages: Array<{
        url: string;
        title: string;
        text: string;
    }>;
    sourceUrls: string[];
}
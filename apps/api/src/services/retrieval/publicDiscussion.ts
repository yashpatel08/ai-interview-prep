export interface DiscussionResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
}

export interface PublicDiscussionSearch {
    search(
        queries: string[],
    ): Promise<DiscussionResult[]>;
}

export class EmptyPublicDiscussionSearch
    implements PublicDiscussionSearch {
    async search(): Promise<DiscussionResult[]> {
        return [];
    }
}
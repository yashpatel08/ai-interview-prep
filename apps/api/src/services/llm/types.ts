export interface GenerateJsonOptions {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

export interface LlmClient {
    generateJson<T>(
        options: GenerateJsonOptions,
        validate: (value: unknown) => T,
    ): Promise<T>;
}
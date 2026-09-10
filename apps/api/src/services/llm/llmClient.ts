import { env } from "../../config/env.js";
import { extractJson } from "./json.js";
import { withRetry, isRetryableStatus } from "./retry.js";
import type {
    GenerateJsonOptions,
    LlmClient,
} from "./types.js";

interface ChatCompletionResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
}

export class OpenAICompatibleClient implements LlmClient {
    async generateJson<T>(
        options: GenerateJsonOptions,
        validate: (value: unknown) => T,
    ): Promise<T> {
        let lastValidationError: unknown;

        for (let attempt = 1; attempt <= 2; attempt += 1) {
            try {
                const raw = await this.request(options);

                const parsed = extractJson(raw);

                return validate(parsed);
            } catch (error) {
                lastValidationError = error;

                if (attempt === 2) {
                    break;
                }

                options = {
                    ...options,
                    systemPrompt: `${options.systemPrompt}

The previous response was invalid.
Return ONLY valid JSON matching the requested structure.
Do not include markdown fences, explanations, or additional text.`,
                };
            }
        }

        throw lastValidationError instanceof Error
            ? lastValidationError
            : new Error("Invalid LLM JSON response");
    }

    private async request(
        options: GenerateJsonOptions,
    ): Promise<string> {
        return withRetry(async () => {
            const controller = new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 30_000);

            try {
                const response = await fetch(
                    `${env.LLM_BASE_URL.replace(/\/$/, "")}/chat/completions`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${env.LLM_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: env.LLM_MODEL,
                            temperature: options.temperature ?? 0,
                            max_tokens: options.maxTokens ?? 2_000,
                            response_format: {
                                type: "json_object",
                            },
                            messages: [
                                {
                                    role: "system",
                                    content: options.systemPrompt,
                                },
                                {
                                    role: "user",
                                    content: options.userPrompt,
                                },
                            ],
                        }),
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    const body = await response.text();

                    if (isRetryableStatus(response.status)) {
                        throw new Error(
                            `Retryable LLM error ${response.status}: ${body}`,
                        );
                    }

                    throw new Error(
                        `LLM request failed with ${response.status}: ${body}`,
                    );
                }

                const data =
                    (await response.json()) as ChatCompletionResponse;

                const content = data.choices?.[0]?.message?.content;

                if (!content) {
                    throw new Error("LLM returned empty content");
                }

                return content;
            } finally {
                clearTimeout(timeout);
            }
        });
    }
}

export const llmClient = new OpenAICompatibleClient();
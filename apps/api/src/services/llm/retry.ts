export function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
}

export async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (attempt === maxAttempts) {
                break;
            }

            const delay = 1_000 * 2 ** (attempt - 1);
            const jitter = Math.floor(Math.random() * 250);

            await sleep(delay + jitter);
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("LLM request failed");
}
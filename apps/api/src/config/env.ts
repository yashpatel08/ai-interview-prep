import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(4000),

    MONGODB_URI: z.string().min(1).optional(),

    FRONTEND_URL: z
        .string()
        .url()
        .default("http://localhost:3000"),

    SESSION_SECRET: z
        .string()
        .min(32)
        .default(
            "development-only-secret-change-this-before-production-123",
        ),

    LLM_API_KEY: z.string().min(1),
    LLM_BASE_URL: z.string().url(),
    LLM_MODEL: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (
    !parsed.success ||
    (parsed.data.NODE_ENV === "production" && !parsed.data.MONGODB_URI)
) {
    console.error("Invalid environment configuration:");

    if (!parsed.success) {
        console.error(parsed.error.flatten().fieldErrors);
    } else {
        console.error({
            MONGODB_URI: [
                "MONGODB_URI is required in production",
            ],
        });
    }

    process.exit(1);
}

export const env = {
    ...parsed.data,
    MONGODB_URI:
        parsed.data.MONGODB_URI ??
        "mongodb://127.0.0.1:27017/ai-interview-prep",
};
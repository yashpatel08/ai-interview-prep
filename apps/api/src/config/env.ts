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

    MONGODB_URI: z
        .string()
        .min(1)
        .default("mongodb://127.0.0.1:27017/ai-interview-prep"),

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

if (!parsed.success) {
    console.error("Invalid environment configuration:");

    console.error(
        parsed.error.flatten().fieldErrors,
    );

    process.exit(1);
}

export const env = parsed.data;
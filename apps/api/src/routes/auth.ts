import { Router } from "express";
import { z } from "zod";

import {
    authenticateUser,
    createSession,
    deleteSession,
    registerUser,
} from "../services/auth/authService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
});

const COOKIE_NAME = "session";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
        process.env.NODE_ENV === "production"
            ? ("none" as const)
            : ("lax" as const),
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
};

router.post("/register", async (req, res, next) => {
    try {
        const parsed = credentialsSchema.safeParse(
            req.body,
        );

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code: "INVALID_INPUT",
                    message:
                        "Email and password are required. Password must be at least 8 characters.",
                },
            });

            return;
        }

        const user = await registerUser(
            parsed.data.email,
            parsed.data.password,
        );

        const token = await createSession(user.id);

        res.cookie(
            COOKIE_NAME,
            token,
            cookieOptions,
        );

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "EMAIL_ALREADY_EXISTS"
        ) {
            res.status(409).json({
                error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: "An account with this email already exists.",
                },
            });

            return;
        }

        next(error);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const parsed = credentialsSchema.safeParse(
            req.body,
        );

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code: "INVALID_INPUT",
                    message: "Invalid email or password.",
                },
            });

            return;
        }

        const user = await authenticateUser(
            parsed.data.email,
            parsed.data.password,
        );

        const token = await createSession(user.id);

        res.cookie(
            COOKIE_NAME,
            token,
            cookieOptions,
        );

        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "INVALID_CREDENTIALS"
        ) {
            res.status(401).json({
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password.",
                },
            });

            return;
        }

        next(error);
    }
});

router.post("/logout", async (req, res, next) => {
    try {
        const token = req.cookies?.[COOKIE_NAME];

        if (token) {
            await deleteSession(token);
        }

        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? ("none" as const)
                    : ("lax" as const),
            path: "/",
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

router.get(
    "/me",
    requireAuth,
    async (req, res) => {
        res.json({
            user: req.user,
        });
    },
);

export const authRouter = router;
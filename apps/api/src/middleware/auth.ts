import type {
    NextFunction,
    Request,
    Response,
} from "express";

import { getUserFromSession } from "../services/auth/authService.js";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            user?: {
                id: string;
                email: string;
            };
        }
    }
}

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const token = req.cookies?.session;

        if (!token) {
            res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required.",
                },
            });

            return;
        }

        const user = await getUserFromSession(token);

        if (!user) {
            res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message: "Session expired or invalid.",
                },
            });

            return;
        }

        req.userId = user.id;
        req.user = {
            id: user.id,
            email: user.email,
        };

        next();
    } catch (error) {
        next(error);
    }
}

export function getAuthenticatedUserId(req: Request): string {
    if (!req.userId) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }

    return req.userId;
}
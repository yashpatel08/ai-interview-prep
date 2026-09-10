import type {
    ErrorRequestHandler,
} from "express";

export const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
) => {
    console.error(error);

    if (res.headersSent) {
        return;
    }

    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred.",
        },
    });
};
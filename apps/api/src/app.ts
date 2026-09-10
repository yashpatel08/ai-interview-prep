import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { kitsRouter } from "./routes/kits.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
export function createApp() {
    const app = express();

    app.disable("x-powered-by");

    app.use(
        cors({
            origin: env.FRONTEND_URL,
            credentials: true,
        }),
    );

    app.use(cookieParser());

    app.use(
        express.json({
            limit: "1mb",
        }),
    );

    app.use(
        express.urlencoded({
            extended: true,
            limit: "1mb",
        }),
    );

    app.get("/", (_req, res) => {
        res.json({
            name: "AI Interview Prep API",
            status: "ok",
        });
    });

    app.use("/api/health", healthRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/kits", kitsRouter);
    app.use(errorHandler);

    return app;
}
import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise: Promise<void> | null = null;

export function connectDatabase(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve();
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    console.log("[DB] connect start, readyState:", mongoose.connection.readyState);
    console.log("[DB] URI host:", env.MONGODB_URI.split("@")[1]?.split("/")[0]);

    connectionPromise = mongoose
        .connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        })
        .then(() => {
            console.log("[DB] connected, readyState:", mongoose.connection.readyState);
        })
        .catch((err: unknown) => {
            connectionPromise = null;
            console.error("[DB] connect FAILED:", err);
            throw err;
        });

    return connectionPromise;
}
import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
    console.log("[DB] connect start, readyState:", mongoose.connection.readyState);
    console.log("[DB] URI host:", env.MONGODB_URI.split("@")[1]?.split("/")[0]);

    try {
        await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("[DB] connected, readyState:", mongoose.connection.readyState);
    } catch (err) {
        console.error("[DB] connect FAILED:", err);
        throw err;
    }
}
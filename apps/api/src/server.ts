import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

async function start() {
    try {
        await connectDatabase();

        const app = createApp();

        app.listen(env.PORT, () => {
            console.log(
                `API running at http://localhost:${env.PORT}`,
            );
        });
    } catch (error) {
        console.error("Failed to start API:", error);

        process.exit(1);
    }
}

void start();
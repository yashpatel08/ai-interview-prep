import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

let dbConnection: Promise<unknown> | null = null;

const app = createApp();

app.use((req, res, next) => {
    if (!dbConnection) {
        dbConnection = connectDatabase();
    }
    dbConnection.then(() => next()).catch(next);
});

export default app;
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

let dbConnection: Promise<unknown> | null = null;

const app = createApp();

app.use((req, res, next) => {
    if (!dbConnection) {
        dbConnection = connectDatabase();
    }
    dbConnection.then(() => next()).catch(next);
});

export default app;
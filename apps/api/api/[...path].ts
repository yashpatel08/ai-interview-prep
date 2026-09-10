import express from "express";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

let dbConnection: Promise<unknown> | null = null;

const innerApp = createApp();

const wrapper = express();

wrapper.use((req, res, next) => {
    if (!dbConnection) {
        dbConnection = connectDatabase();
    }
    dbConnection.then(() => next()).catch(next);
});

wrapper.use(innerApp);

export default wrapper;
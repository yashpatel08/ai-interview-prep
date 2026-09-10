import express from "express";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

const innerApp = createApp();

const wrapper = express();

wrapper.use((req, res, next) => {
    connectDatabase().then(() => next()).catch(next);
});

wrapper.use(innerApp);

export default wrapper;
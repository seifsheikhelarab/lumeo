import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import { router } from "../routes.js";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.use(express.static(path.join(process.cwd(), "public")));

app.use("/", router);

// Start server
const port = process.env.PORT || 4650;
app.listen(port, () => console.log(`App Started on http://localhost:${port}`));

export default app;
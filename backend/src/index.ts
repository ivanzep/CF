import "dotenv/config";
import express from "express";
import cors from "cors";
import { projectsRouter } from "./routes/projects";
import { categoriesRouter } from "./routes/categories";
import { lineItemsRouter, lineItemsForProjectRouter } from "./routes/lineItems";
import { drawsRouter, drawsForProjectRouter } from "./routes/draws";
import { capTableRouter, capTableForProjectRouter } from "./routes/capTable";
import { summaryRouter } from "./routes/summary";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/projects/:projectId/line-items", lineItemsForProjectRouter);
app.use("/api/projects/:projectId/draws", drawsForProjectRouter);
app.use("/api/projects/:projectId", capTableForProjectRouter);
app.use("/api/projects/:projectId", summaryRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/line-items", lineItemsRouter);
app.use("/api/draws", drawsRouter);
app.use("/api/cap-table", capTableRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`cf-backend listening on http://localhost:${port}`);
});

import express from "express";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { workflowsRouter, runsRouter } from "./routes/workflows.js";
import { waitlistRouter } from "./routes/waitlist.js";
import { pingDb } from "./db/client.js";

try {
  await pingDb();
} catch (err) {
  logger.fatal({ err: (err as Error).message }, "database unreachable; aborting");
  process.exit(1);
}

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err: err.message, stack: err.stack }, "uncaught exception");
});

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/workflows", workflowsRouter);
app.use("/runs", runsRouter);
app.use("/waitlist", waitlistRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err: err.message, stack: err.stack }, "unhandled route error");
    if (res.headersSent) return;
    res.status(500).json({ error: err.message ?? "internal error" });
  }
);

app.listen(config.PORT, () => {
  logger.info(`flowpay backend listening on :${config.PORT}`);
});

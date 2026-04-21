import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { Keypair } from "@stellar/stellar-sdk";
import type { Workflow } from "../../../shared/types.js";
import * as engine from "../engine/workflowEngine.js";
import { EngineError } from "../engine/workflowEngine.js";
import { db } from "../db/client.js";
import { workflows, workflowRuns, tickEvents, sessionSigners } from "../db/schema.js";
import { encryptSecret } from "../services/sessionCrypto.js";

const nodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["trigger", "strategy", "action", "asset"]),
  type: z.string().min(1),
  params: z.record(z.unknown()),
});

const edgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
});

const workflowSchema = z.object({
  name: z.string().min(1),
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema),
});

const sessionSchema = z.object({
  ownerAccount: z.string().min(1),
  secretKey: z.string().min(1),
  policy: z.object({
    pair: z.string().min(1),
    maxNotional: z.number().positive(),
  }),
  ttlMinutes: z.number().int().positive().max(240).optional(),
});

const startSchema = z
  .object({
    sessionSignerId: z.string().min(1).nullable().optional(),
  })
  .optional();

function rowToWorkflow(row: typeof workflows.$inferSelect): Workflow {
  return {
    id: row.id,
    name: row.name,
    nodes: row.nodes as Workflow["nodes"],
    edges: row.edges as Workflow["edges"],
  };
}

async function loadWorkflow(id: string): Promise<Workflow | null> {
  const rows = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  if (rows.length === 0) return null;
  return rowToWorkflow(rows[0]);
}

export const workflowsRouter = Router();

workflowsRouter.post("/", async (req: Request, res: Response) => {
  const parsed = workflowSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const id = randomUUID();
  const now = Date.now();
  await db.insert(workflows).values({
    id,
    name: parsed.data.name,
    nodes: parsed.data.nodes,
    edges: parsed.data.edges,
    createdAt: now,
    updatedAt: now,
  });
  return res.status(201).json({ id });
});

workflowsRouter.get("/", async (_req: Request, res: Response) => {
  const rows = await db.select().from(workflows);
  return res.json(rows.map(rowToWorkflow));
});

workflowsRouter.get("/:id", async (req: Request, res: Response) => {
  const wf = await loadWorkflow(req.params.id as string);
  if (!wf) return res.status(404).json({ error: "not found" });
  return res.json(wf);
});

workflowsRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const wf = await loadWorkflow(id);
  if (!wf) return res.status(404).json({ error: "not found" });
  if (engine.status(id).running) {
    await engine.stop(id);
  }
  await db.delete(workflows).where(eq(workflows.id, id));
  return res.status(204).end();
});

workflowsRouter.post("/:id/start", async (req: Request, res: Response) => {
  const wf = await loadWorkflow(req.params.id as string);
  if (!wf) return res.status(404).json({ error: "not found" });
  const parsed = startSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const result = await engine.start(wf, {
      sessionSignerId: parsed.data?.sessionSignerId ?? null,
    });
    return res.json(result);
  } catch (err) {
    const e = err as EngineError;
    const status = e instanceof EngineError ? e.status : 500;
    return res.status(status).json({ error: e.message ?? "failed to start" });
  }
});

workflowsRouter.post("/:id/stop", async (req: Request, res: Response) => {
  const result = await engine.stop(req.params.id as string);
  return res.json(result);
});

workflowsRouter.get("/:id/status", async (req: Request, res: Response) => {
  const wf = await loadWorkflow(req.params.id as string);
  if (!wf) return res.status(404).json({ error: "not found" });
  return res.json(engine.status(req.params.id as string));
});

workflowsRouter.get("/:id/events", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const wf = await loadWorkflow(id);
  if (!wf) return res.status(404).json({ error: "not found" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const status = engine.status(id);
  const hello: engine.WorkflowEvent = {
    ts: Date.now(),
    kind: "info",
    message: status.running ? "Subscribed · workflow is running" : "Subscribed · workflow is idle",
    data: { running: status.running },
  };
  res.write(`data: ${JSON.stringify(hello)}\n\n`);

  const unsub = engine.subscribe(id, (event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      /* client gone */
    }
  });

  const keepalive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      /* ignore */
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(keepalive);
    unsub();
    try {
      res.end();
    } catch {
      /* ignore */
    }
  };

  req.on("close", cleanup);
  req.on("aborted", cleanup);
});

workflowsRouter.get("/:id/runs", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const wf = await loadWorkflow(id);
  if (!wf) return res.status(404).json({ error: "not found" });

  const runs = await db
    .select({
      id: workflowRuns.id,
      startedAt: workflowRuns.startedAt,
      stoppedAt: workflowRuns.stoppedAt,
      status: workflowRuns.status,
      errorMessage: workflowRuns.errorMessage,
    })
    .from(workflowRuns)
    .where(eq(workflowRuns.workflowId, id))
    .orderBy(desc(workflowRuns.startedAt))
    .limit(50);

  if (runs.length === 0) return res.json([]);

  const counts = await db
    .select({
      runId: tickEvents.runId,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(tickEvents)
    .where(inArray(tickEvents.runId, runs.map((r) => r.id)))
    .groupBy(tickEvents.runId);

  const countByRun = new Map<string, number>(
    counts.map((c) => [c.runId, Number(c.count)])
  );
  const shaped = runs.map((r) => ({
    ...r,
    eventCount: countByRun.get(r.id) ?? 0,
  }));
  return res.json(shaped);
});

workflowsRouter.post("/:id/sessions", async (req: Request, res: Response) => {
  const wf = await loadWorkflow(req.params.id as string);
  if (!wf) return res.status(404).json({ error: "not found" });
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  let derivedPublicKey: string;
  try {
    derivedPublicKey = Keypair.fromSecret(parsed.data.secretKey).publicKey();
  } catch {
    return res.status(400).json({ error: "invalid secretKey (not a Stellar secret)" });
  }
  const now = Date.now();
  const ttlMs = (parsed.data.ttlMinutes ?? 60) * 60_000;
  const id = randomUUID();
  await db.insert(sessionSigners).values({
    id,
    workflowId: wf.id,
    ownerAccount: parsed.data.ownerAccount,
    publicKey: derivedPublicKey,
    secretCiphertext: encryptSecret(parsed.data.secretKey),
    policy: parsed.data.policy,
    createdAt: now,
    expiresAt: now + ttlMs,
    revokedAt: null,
  });
  return res.status(201).json({
    id,
    publicKey: derivedPublicKey,
    expiresAt: now + ttlMs,
  });
});

workflowsRouter.get("/:id/sessions", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const rows = await db
    .select({
      id: sessionSigners.id,
      ownerAccount: sessionSigners.ownerAccount,
      publicKey: sessionSigners.publicKey,
      policy: sessionSigners.policy,
      createdAt: sessionSigners.createdAt,
      expiresAt: sessionSigners.expiresAt,
      revokedAt: sessionSigners.revokedAt,
    })
    .from(sessionSigners)
    .where(eq(sessionSigners.workflowId, id))
    .orderBy(desc(sessionSigners.createdAt))
    .limit(20);
  return res.json(rows);
});

workflowsRouter.delete(
  "/:id/sessions/:sid",
  async (req: Request, res: Response) => {
    const sid = req.params.sid as string;
    await db
      .update(sessionSigners)
      .set({ revokedAt: Date.now() })
      .where(eq(sessionSigners.id, sid));
    return res.status(204).end();
  }
);

export const runsRouter = Router();

runsRouter.get("/:runId/events", async (req: Request, res: Response) => {
  const runId = req.params.runId as string;
  const limitRaw = Number(req.query.limit ?? 200);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, Math.floor(limitRaw))) : 200;
  const beforeRaw = req.query.before !== undefined ? Number(req.query.before) : NaN;
  const before = Number.isFinite(beforeRaw) ? beforeRaw : null;

  const whereClause =
    before !== null
      ? and(eq(tickEvents.runId, runId), lt(tickEvents.ts, before))
      : eq(tickEvents.runId, runId);

  const rows = await db
    .select({
      id: tickEvents.id,
      runId: tickEvents.runId,
      ts: tickEvents.ts,
      kind: tickEvents.kind,
      nodeId: tickEvents.nodeId,
      message: tickEvents.message,
      data: tickEvents.data,
    })
    .from(tickEvents)
    .where(whereClause)
    .orderBy(tickEvents.ts)
    .limit(limit);

  const shaped = rows.map((r) => ({
    id: r.id,
    runId: r.runId,
    ts: r.ts,
    kind: r.kind,
    nodeId: r.nodeId,
    message: r.message,
    data: r.data ?? null,
  }));
  return res.json(shaped);
});

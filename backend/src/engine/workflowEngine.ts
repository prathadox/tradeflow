import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { and, eq, isNull, gt } from "drizzle-orm";
import type { Workflow, WorkflowEdge, WorkflowNode } from "../../../shared/types.js";
import { logger } from "../logger.js";
import { startTimeTrigger, type TimeTriggerHandle } from "./triggers/time.js";
import {
  runArbitrageTick,
  type ArbitrageParams,
  type ArbitrageEvent,
} from "../strategies/arbitrage.js";
import { parsePair } from "../services/stellar.js";
import { pairToBinanceSymbol } from "../services/binance.js";
import { db } from "../db/client.js";
import { workflowRuns, tickEvents, sessionSigners } from "../db/schema.js";
import { decryptSecret } from "../services/sessionCrypto.js";

export interface WorkflowEvent {
  ts: number;
  kind: "tick" | "decision" | "error" | "info";
  nodeId?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface SessionPolicy {
  pair: string;
  maxNotional: number;
}

const emitters = new Map<string, EventEmitter>();

function getEmitter(workflowId: string): EventEmitter {
  let em = emitters.get(workflowId);
  if (!em) {
    em = new EventEmitter();
    em.setMaxListeners(100);
    emitters.set(workflowId, em);
  }
  return em;
}

export function subscribe(
  workflowId: string,
  handler: (event: WorkflowEvent) => void
): () => void {
  const em = getEmitter(workflowId);
  em.on("event", handler);
  return () => {
    em.off("event", handler);
  };
}

function emitEvent(workflowId: string, event: WorkflowEvent): void {
  const em = emitters.get(workflowId);
  if (em) em.emit("event", event);
}

interface AssetRef {
  code: string;
  issuer?: string;
}

function assetTokenFromNode(node: WorkflowNode): AssetRef | null {
  if (node.kind !== "asset") return null;
  const code = typeof node.params.code === "string" ? node.params.code.trim() : "";
  if (!code) return null;
  const issuerRaw =
    typeof node.params.issuer === "string" ? node.params.issuer.trim() : "";
  const ref: AssetRef = { code };
  if (issuerRaw) ref.issuer = issuerRaw;
  return ref;
}

function formatAssetToken(ref: AssetRef): string {
  const upper = ref.code.toUpperCase();
  if (upper === "XLM" || upper === "NATIVE") return "XLM";
  if (ref.issuer) return `${ref.code}:${ref.issuer}`;
  return ref.code;
}

function deriveAssetPair(
  strategyNode: WorkflowNode,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string | null {
  const baseId =
    typeof strategyNode.params.baseAssetId === "string"
      ? strategyNode.params.baseAssetId
      : null;
  const quoteId =
    typeof strategyNode.params.quoteAssetId === "string"
      ? strategyNode.params.quoteAssetId
      : null;
  if (baseId && quoteId) {
    const baseNode = nodes.find((n) => n.id === baseId);
    const quoteNode = nodes.find((n) => n.id === quoteId);
    const base = baseNode ? assetTokenFromNode(baseNode) : null;
    const quote = quoteNode ? assetTokenFromNode(quoteNode) : null;
    if (base && quote) {
      return `${formatAssetToken(base)}/${formatAssetToken(quote)}`;
    }
  }

  const incoming = edges.filter((e) => e.target === strategyNode.id);
  const byHandle: Record<string, AssetRef> = {};
  for (const e of incoming) {
    const handle = e.targetHandle;
    if (handle !== "base" && handle !== "quote") continue;
    const src = nodes.find((n) => n.id === e.source);
    if (!src) continue;
    const ref = assetTokenFromNode(src);
    if (!ref) continue;
    byHandle[handle] = ref;
  }
  if (byHandle.base && byHandle.quote) {
    return `${formatAssetToken(byHandle.base)}/${formatAssetToken(byHandle.quote)}`;
  }
  return null;
}

interface ActiveRun {
  stop: () => void;
  startedAt: number;
  runId: string;
  sessionSignerId: string | null;
}

async function persistEvent(runId: string, event: WorkflowEvent): Promise<void> {
  try {
    await db.insert(tickEvents).values({
      runId,
      ts: event.ts,
      kind: event.kind,
      nodeId: event.nodeId ?? null,
      message: event.message,
      data: event.data ?? null,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message, runId }, "failed to persist event");
  }
}

const active = new Map<string, ActiveRun>();

export interface StartResult {
  running: true;
  alreadyRunning?: boolean;
  startedAt: number;
}

export class EngineError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function findTrigger(nodes: WorkflowNode[]): WorkflowNode {
  const triggers = nodes.filter((n) => n.kind === "trigger");
  if (triggers.length === 0) {
    throw new EngineError("workflow has no trigger node");
  }
  if (triggers.length > 1) {
    throw new EngineError("workflow must have exactly one trigger");
  }
  const t = triggers[0];
  if (t.type === "payment") {
    throw new EngineError("unsupported trigger: payment (not implemented)");
  }
  if (t.type !== "time_interval") {
    throw new EngineError(`unsupported trigger type: ${t.type}`);
  }
  return t;
}

function findStrategy(nodes: WorkflowNode[]): WorkflowNode {
  const strategies = nodes.filter((n) => n.kind === "strategy");
  if (strategies.length === 0) {
    throw new EngineError("workflow has no strategy node");
  }
  if (strategies.length > 1) {
    throw new EngineError("workflow must have exactly one strategy");
  }
  const s = strategies[0];
  if (s.type !== "arbitrage") {
    throw new EngineError(`unsupported strategy type: ${s.type}`);
  }
  return s;
}

function coerceArbitrageParams(
  raw: Record<string, unknown>,
  pairOverride?: string
): ArbitrageParams {
  const pair =
    pairOverride !== undefined
      ? pairOverride
      : typeof raw.pair === "string"
      ? raw.pair
      : "";
  const threshold = typeof raw.threshold === "number" ? raw.threshold : Number(raw.threshold);
  if (!pair) throw new EngineError("arbitrage.params.pair is required");
  if (!Number.isFinite(threshold))
    throw new EngineError("arbitrage.params.threshold must be a number");
  const out: ArbitrageParams = { pair, threshold };
  if (raw.feeBps !== undefined) out.feeBps = Number(raw.feeBps);
  if (raw.slippageBps !== undefined) out.slippageBps = Number(raw.slippageBps);
  if (raw.dryRun !== undefined) out.dryRun = Boolean(raw.dryRun);
  if (raw.notional !== undefined) out.notional = Number(raw.notional);
  return out;
}

function dispatchEvent(workflowId: string, runId: string, event: WorkflowEvent): void {
  void persistEvent(runId, event);
  emitEvent(workflowId, event);
}

async function loadActiveSessionKeypair(
  sessionSignerId: string,
  requiredPair: string,
  notional: number
): Promise<{ keypair: Keypair; signerId: string }> {
  const rows = await db
    .select()
    .from(sessionSigners)
    .where(
      and(
        eq(sessionSigners.id, sessionSignerId),
        isNull(sessionSigners.revokedAt),
        gt(sessionSigners.expiresAt, Date.now())
      )
    )
    .limit(1);
  if (rows.length === 0) {
    throw new EngineError(
      "session signer is missing, revoked, or expired — re-authorize to continue",
      400
    );
  }
  const row = rows[0];
  const policy = row.policy as SessionPolicy;
  if (policy.pair !== requiredPair) {
    throw new EngineError(
      `session policy pair mismatch (policy=${policy.pair}, workflow=${requiredPair})`,
      400
    );
  }
  if (notional > policy.maxNotional) {
    throw new EngineError(
      `notional ${notional} exceeds session policy max ${policy.maxNotional}`,
      400
    );
  }
  const secret = decryptSecret(row.secretCiphertext);
  return { keypair: Keypair.fromSecret(secret), signerId: row.id };
}

export interface StartOptions {
  sessionSignerId?: string | null;
}

export async function start(
  workflow: Workflow,
  opts: StartOptions = {}
): Promise<StartResult> {
  const existing = active.get(workflow.id);
  if (existing) {
    return { running: true, alreadyRunning: true, startedAt: existing.startedAt };
  }

  const trigger = findTrigger(workflow.nodes);
  const strategy = findStrategy(workflow.nodes);
  const derivedPair = deriveAssetPair(strategy, workflow.nodes, workflow.edges);
  const pairSource: "assets" | "strategy" = derivedPair ? "assets" : "strategy";
  const params = coerceArbitrageParams(strategy.params, derivedPair ?? undefined);

  try {
    parsePair(params.pair);
    pairToBinanceSymbol(params.pair);
  } catch (err) {
    throw new EngineError((err as Error).message, 400);
  }

  const intervalSec = Number(trigger.params.interval);
  if (!Number.isFinite(intervalSec) || intervalSec <= 0) {
    throw new EngineError("trigger.params.interval must be a positive number (seconds)");
  }

  let keypair: Keypair | undefined;
  let sessionSignerId: string | null = null;
  if (params.dryRun === false) {
    if (!opts.sessionSignerId) {
      throw new EngineError(
        "sessionSignerId is required for non-dryRun execution",
        400
      );
    }
    const loaded = await loadActiveSessionKeypair(
      opts.sessionSignerId,
      params.pair,
      params.notional ?? 100
    );
    keypair = loaded.keypair;
    sessionSignerId = loaded.signerId;
  }

  const runLogger = logger.child({ workflowId: workflow.id, workflow: workflow.name });
  const strategyNodeId = strategy.id;
  const triggerNodeId = trigger.id;
  const startedAt = Date.now();
  const runId = randomUUID();

  await db.insert(workflowRuns).values({
    id: runId,
    workflowId: workflow.id,
    startedAt,
    stoppedAt: null,
    status: "running",
    errorMessage: null,
  });

  const onEvent = (e: ArbitrageEvent): void => {
    dispatchEvent(workflow.id, runId, {
      ts: Date.now(),
      kind: e.kind,
      nodeId: strategyNodeId,
      message: e.message,
      data: e.data,
    });
  };

  const handle: TimeTriggerHandle = startTimeTrigger({
    intervalMs: intervalSec * 1000,
    handler: async () => {
      dispatchEvent(workflow.id, runId, {
        ts: Date.now(),
        kind: "tick",
        nodeId: triggerNodeId,
        message: "Trigger fired",
      });
      try {
        await runArbitrageTick(params, { logger: runLogger, keypair, onEvent });
      } catch (err) {
        const message = (err as Error).message ?? "unknown error";
        await db
          .update(workflowRuns)
          .set({ status: "error", errorMessage: message, stoppedAt: Date.now() })
          .where(eq(workflowRuns.id, runId));
        dispatchEvent(workflow.id, runId, {
          ts: Date.now(),
          kind: "error",
          nodeId: strategyNodeId,
          message: `Unhandled error: ${message}`,
        });
        const run = active.get(workflow.id);
        if (run) {
          run.stop();
          active.delete(workflow.id);
        }
      }
    },
  });

  active.set(workflow.id, { stop: handle.stop, startedAt, runId, sessionSignerId });
  const pairLogMessage =
    pairSource === "assets"
      ? `Pair derived from assets: ${params.pair}`
      : `Pair from strategy params: ${params.pair}`;
  runLogger.info(
    { intervalSec, params, runId, pairSource },
    "workflow started"
  );
  dispatchEvent(workflow.id, runId, {
    ts: Date.now(),
    kind: "info",
    message: `Workflow started · ${pairLogMessage}`,
    data: {
      intervalSec,
      pair: params.pair,
      pairSource,
      runId,
      sessionSignerId,
      dryRun: params.dryRun ?? true,
    },
  });
  return { running: true, startedAt };
}

export async function stop(
  workflowId: string
): Promise<{ running: false; stopped: boolean }> {
  const run = active.get(workflowId);
  if (!run) return { running: false, stopped: false };
  run.stop();
  active.delete(workflowId);
  const stoppedAt = Date.now();
  await db
    .update(workflowRuns)
    .set({ status: "stopped", stoppedAt })
    .where(eq(workflowRuns.id, run.runId));
  logger.info({ workflowId, runId: run.runId }, "workflow stopped");
  dispatchEvent(workflowId, run.runId, {
    ts: stoppedAt,
    kind: "info",
    message: "Workflow stopped",
  });
  return { running: false, stopped: true };
}

export function status(workflowId: string): { running: boolean; startedAt?: number } {
  const run = active.get(workflowId);
  if (!run) return { running: false };
  return { running: true, startedAt: run.startedAt };
}

import {
  pgTable,
  text,
  bigint,
  bigserial,
  serial,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const workflows = pgTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const workflowRuns = pgTable("workflow_runs", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  startedAt: bigint("started_at", { mode: "number" }).notNull(),
  stoppedAt: bigint("stopped_at", { mode: "number" }),
  status: text("status", { enum: ["running", "stopped", "error"] }).notNull(),
  errorMessage: text("error_message"),
});

export const tickEvents = pgTable(
  "tick_events",
  {
    id: serial("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => workflowRuns.id, { onDelete: "cascade" }),
    ts: bigint("ts", { mode: "number" }).notNull(),
    kind: text("kind", { enum: ["tick", "decision", "error", "info"] }).notNull(),
    nodeId: text("node_id"),
    message: text("message").notNull(),
    data: jsonb("data"),
  },
  (t) => ({
    runIdTsIdx: index("tick_events_run_id_ts_idx").on(t.runId, t.ts),
  })
);

export const sessionSigners = pgTable(
  "session_signers",
  {
    id: text("id").primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    ownerAccount: text("owner_account").notNull(),
    publicKey: text("public_key").notNull(),
    secretCiphertext: text("secret_ciphertext").notNull(),
    policy: jsonb("policy").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
    revokedAt: bigint("revoked_at", { mode: "number" }),
  },
  (t) => ({
    workflowIdIdx: index("session_signers_workflow_id_idx").on(t.workflowId),
  })
);

export const waitlistSignups = pgTable("waitlist_signups", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),
  referrer: text("referrer"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

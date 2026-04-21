CREATE TABLE IF NOT EXISTS "workflows" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "nodes" jsonb NOT NULL,
  "edges" jsonb NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "workflow_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "workflow_id" text NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "started_at" bigint NOT NULL,
  "stopped_at" bigint,
  "status" text NOT NULL,
  "error_message" text
);

CREATE TABLE IF NOT EXISTS "tick_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "run_id" text NOT NULL REFERENCES "workflow_runs"("id") ON DELETE CASCADE,
  "ts" bigint NOT NULL,
  "kind" text NOT NULL,
  "node_id" text,
  "message" text NOT NULL,
  "data" jsonb
);

CREATE INDEX IF NOT EXISTS "tick_events_run_id_ts_idx" ON "tick_events" ("run_id", "ts");

CREATE TABLE IF NOT EXISTS "session_signers" (
  "id" text PRIMARY KEY NOT NULL,
  "workflow_id" text NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "owner_account" text NOT NULL,
  "public_key" text NOT NULL,
  "secret_ciphertext" text NOT NULL,
  "policy" jsonb NOT NULL,
  "created_at" bigint NOT NULL,
  "expires_at" bigint NOT NULL,
  "revoked_at" bigint
);

CREATE INDEX IF NOT EXISTS "session_signers_workflow_id_idx" ON "session_signers" ("workflow_id");

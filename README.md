# FlowPay

Workflow-based trading & payment engine on Stellar. FlowPay runs user-defined workflows — time-triggered arbitrage, payment-triggered payouts, threshold-triggered rebalancing — and executes them as real Stellar transactions (testnet by default).

- **Backend:** Node.js + Express + Drizzle ORM (Postgres) + Stellar SDK
- **Frontend:** Vite + React + React Router + Zustand + React Flow (`@xyflow/react`) + Freighter
- **Monorepo:** pnpm workspaces (`backend`, `frontend`) with shared types in `shared/`

## Repo layout

```
backend/
  src/
    index.ts              # Express app (routes, health, error handler)
    config.ts             # env parsing
    db/                   # drizzle client + schema
    engine/               # workflow engine + triggers
    strategies/arbitrage  # Stellar DEX vs Binance arbitrage loop
    services/             # stellar, binance, session crypto
    routes/               # /workflows, /runs, /waitlist
  drizzle/                # SQL migrations (0000_init, 0002_waitlist)
  drizzle.config.ts
frontend/
  src/
    pages/                # Landing, WorkflowBuilder
    nodes/                # Trigger/Strategy/Action/Asset React-Flow nodes
    components/ ui/       # primitives + composed components
    api/ store/ lib/      # API client, Zustand store, utilities
shared/
  types.ts                # shared Workflow / node / edge types
.env.example
pnpm-workspace.yaml
```

## Prerequisites

- Node.js 18+ (tested on 24)
- pnpm 10 (`corepack enable` then `corepack prepare pnpm@10.26.1 --activate`)
- A Postgres database — the `.env.example` is wired for Supabase's pooler (port 6543)
- A Stellar testnet account (for live trades; `dryRun` workflows work without one)

## Setup

```bash
git clone <repo-url>
cd "Flow trade"
pnpm install
cp .env.example .env
# then edit .env — at minimum: DATABASE_URL and SESSION_ENCRYPTION_KEY
```

Generate a session encryption key:

```bash
openssl rand -hex 32
```

Apply migrations to your Postgres:

```bash
# from backend/, using psql against the same DATABASE_URL
psql "$DATABASE_URL" -f drizzle/0000_init.sql
psql "$DATABASE_URL" -f drizzle/0002_waitlist.sql
```

> Migrations are tracked as plain SQL under `backend/drizzle/`. `drizzle-kit` is available as a dev dep if you want to generate new ones (`pnpm --filter backend exec drizzle-kit generate`).

## Run

Two terminals:

```bash
# backend — http://localhost:3001
pnpm dev:backend

# frontend — http://localhost:5173
pnpm --filter frontend dev
```

Health check:

```bash
curl -s http://localhost:3001/health
```

## Environment

| Variable                 | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `PORT`                   | Backend HTTP port (default 3001)                              |
| `STELLAR_NETWORK`        | `testnet` or `public`                                         |
| `HORIZON_URL`            | Stellar Horizon endpoint                                      |
| `BINANCE_API_URL`        | External price source for arbitrage reference                 |
| `DATABASE_URL`           | Postgres connection (Supabase pooler on 6543 recommended)     |
| `SESSION_ENCRYPTION_KEY` | ≥32-char key material for AES-256-GCM of session-signer secrets |
| `VITE_API_URL`           | Optional frontend override; defaults to `http://localhost:3001` |

Rotating `SESSION_ENCRYPTION_KEY` invalidates all stored session-signer ciphertexts — only do it alongside a wipe of `session_signers`.

## HTTP surface

Mounted in `backend/src/index.ts`:

- `GET  /health`
- `POST /workflows` — create workflow (nodes + edges JSON)
- `GET  /workflows` — list
- `GET  /workflows/:id` — detail
- `DELETE /workflows/:id`
- `POST /workflows/:id/start` — begin running (optional `sessionSignerId` in body)
- `POST /workflows/:id/stop`
- `GET  /workflows/:id/status`
- `GET  /workflows/:id/events` — SSE stream of tick/decision events
- `GET  /workflows/:id/runs` — last 50 runs with `eventCount`
- `POST /workflows/:id/sessions` — create time-boxed session signer (encrypted at rest)
- `GET  /workflows/:id/sessions` — list non-expired signers
- `DELETE /workflows/:id/sessions/:sessionId` — revoke
- `GET  /runs/:runId/events` — paginated event log
- `POST /waitlist` — public waitlist signup (rate-limited)

## Workflow model

A workflow is `{ name, nodes, edges }` where each node is one of:

- `trigger` — time interval, payment stream, or price threshold
- `strategy` — e.g. arbitrage
- `action` — trade or transfer
- `asset` — declares an asset context for other nodes

The engine loads a workflow, materializes a run row, and drives it via the trigger it finds in the graph. For the arbitrage strategy, each tick compares Stellar DEX book vs a Binance reference price, checks spread against `threshold + feeBps + slippageBps`, and either skips or submits an offer. All ticks are persisted to `tick_events` and streamed via SSE.

## Session signers

A session signer is a scoped, TTL-bound Stellar secret key the backend is allowed to sign with on the user's behalf. Secrets are AES-256-GCM encrypted at rest using `SESSION_ENCRYPTION_KEY`. Signers carry a policy (`pair`, `maxNotional`) that the engine enforces before submission. Revoke via `DELETE /workflows/:id/sessions/:sessionId`; expired ones are filtered out of listings.

## Safety notes

- Default to `dryRun: true` on new workflows; flip to live only after reviewing tick logs.
- Use testnet (`STELLAR_NETWORK=testnet`, `HORIZON_URL=https://horizon-testnet.stellar.org`) until you're confident.
- Arbitrage math already accounts for `feeBps` and `slippageBps`, but low-liquidity pairs can still fill at worse prices than the top-of-book tick suggested.
- Never commit a real secret key — use session signers.

## Scripts quick reference

```bash
pnpm install                              # install workspace deps
pnpm dev:backend                          # backend dev server (tsx watch)
pnpm --filter frontend dev                # frontend dev server (vite)
pnpm --filter frontend build              # typecheck + vite build
pnpm --filter backend exec tsc --noEmit   # backend typecheck
pnpm --filter backend exec drizzle-kit generate  # new SQL migration from schema
```

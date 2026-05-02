# How transactions are executed on behalf of the user

End-to-end map of the delegated-signing flow. No abstractions, no hand-waving — just code paths, conditions, and threat model.

## The model: session signers (delegated keys), not custody

The backend never signs with the user's *primary* Stellar account. Instead, the user hands the backend a **scoped, time-boxed Stellar secret key** — a "session signer" — and the backend stores it encrypted and uses it to sign trades while the workflow is running.

That key is created by the user (their Freighter wallet or scripted) and added to their Stellar account as an **additional signer** via Stellar's multi-sig (low-weight, optional med threshold, etc.). The session signer can sign DEX offers but, if set up correctly, can't drain the account or change signers. The backend treats the secret as a bearer credential — anyone holding it can sign for whatever the on-chain weights allow.

Code path:

- `POST /workflows/:id/sessions` (`backend/src/routes/workflows.ts:232`) accepts `{ ownerAccount, secretKey, policy: { pair, maxNotional }, ttlMinutes ≤ 240 }`.
- Secret is AES-256-GCM encrypted with `SESSION_ENCRYPTION_KEY` (`backend/src/services/sessionCrypto.ts:7`) and written to `session_signers` with `expiresAt` and a JSON `policy`.
- Public key is derived back from the secret and returned, so the UI can show "this is the signer you added."

## How a tick actually executes a trade

1. `POST /workflows/:id/start` with `{ sessionSignerId }` (`backend/src/routes/workflows.ts:126`).
2. `engine.start` (`backend/src/engine/workflowEngine.ts:265`) validates the workflow graph, derives the asset pair from the connected `asset` nodes, and — only if `dryRun === false` — calls `loadActiveSessionKeypair` (`backend/src/engine/workflowEngine.ts:221`).
3. `loadActiveSessionKeypair` enforces three gates **before** decrypting:
   - row exists, `revokedAt IS NULL`, `expiresAt > now`
   - `policy.pair === workflow.pair`
   - `notional ≤ policy.maxNotional`

   Only then does it `decryptSecret` and build a `Keypair`. The keypair lives in memory for the lifetime of the run; it's not re-read from DB per tick.
4. The time trigger fires every N seconds → `runArbitrageTick` (`backend/src/strategies/arbitrage.ts:31`) compares Stellar DEX top-of-book vs Binance reference, subtracts `feeBps + slippageBps`, and:
   - if net edge `< threshold` → skip
   - if `dryRun` → emit "would trade" decision, no submission
   - if direction is `sell_stellar_buy_binance` → skip (only the buy side is implemented)
   - else → `placeBuyOffer` (`backend/src/services/stellar.ts:57`): loads the signer's account, builds a `manageBuyOffer`, signs with the session keypair, submits to Horizon, returns the tx hash.

## Conditions that MUST hold for a real trade to fire

All of these have to be true simultaneously, otherwise the tick degrades to a skip / dry-run / error:

1. **Workflow shape** — exactly one trigger (`type: "time_interval"`, positive `interval` seconds), exactly one strategy (`type: "arbitrage"`), connected `asset` nodes (or explicit `baseAssetId/quoteAssetId`) so the pair can be derived. `payment` triggers are stubbed and throw.
2. **`dryRun: false`** in the strategy params. Default is `true`. This is the live/dry switch.
3. **`sessionSignerId` provided** in the start request. Without it, non-dry-run start throws `400`.
4. **Session signer is alive** — exists, not revoked, `expiresAt > now`, TTL ≤ 240 min (4h cap).
5. **Policy match** — `policy.pair` must equal the pair derived from the workflow graph; `notional` must be ≤ `policy.maxNotional`.
6. **`SESSION_ENCRYPTION_KEY`** unchanged since the signer was stored — rotating it bricks every existing ciphertext (`decryptSecret` will throw on auth-tag mismatch).
7. **Stellar side**:
   - The session signer's public key must actually be a signer on `ownerAccount` on-chain, with enough weight to authorize `manageBuyOffer`. The backend does **not** verify this — if you skip the on-chain `setOptions` step, Horizon will reject the tx at submit time.
   - `ownerAccount` (or the signer's own account, depending on which `loadAccount` is used) needs sufficient XLM reserve and the quote-asset balance + trustline for the buying asset. Note: `placeBuyOffer` calls `server.loadAccount(keypair.publicKey())` — it loads the *session signer's* own account, not `ownerAccount`. **That's a real bug if you intended the user's main account to be the source.** As written today, the trade is sourced from whatever account the session keypair *itself* identifies, which only works if the session secret is the user's main account secret. There's no `sourceAccount` override on the operation.
8. **Market side** — both sides of the Stellar orderbook non-empty, Binance ticker reachable, net edge ≥ threshold, direction is `buy_stellar_sell_binance` (the sell-on-Stellar leg is intentionally not submitted).
9. **Horizon timing** — `setTimeout(30)`, base fee. No fee bumps, no retries on `tx_bad_seq` / `tx_too_late`. A failed submit becomes an error event and **stops the run** (`backend/src/engine/workflowEngine.ts:346`).

## Threat model / things to know

- **The backend can sign anything the on-chain signer weights allow.** "Policy" (pair, maxNotional) is enforced *in app code only*. If someone bypasses the engine and decrypts the row, they get a usable Stellar secret.
- **Encryption key derivation is `scryptSync(KEY, "flowpay-session", 32)` with a fixed salt** — the salt being constant is fine for a single-tenant app keyed off `SESSION_ENCRYPTION_KEY`, but it's not per-row. Compromise of `SESSION_ENCRYPTION_KEY` = compromise of every stored secret.
- **TTL ≤ 4h** is the only blast-radius cap aside from `maxNotional`. There's no per-tick rate limit, no daily cap, no kill-switch beyond `DELETE /workflows/:id/sessions/:sessionId` (sets `revokedAt`; the in-memory keypair from a *running* workflow is **not** invalidated until the run is stopped/restarted — revoke only blocks the next start).
- **No auth on the HTTP routes.** Anyone who can hit the backend can create workflows, upload secrets, start runs. That's a "must add before prod" item, not a feature.

## TL;DR

User generates a low-privilege Stellar keypair, adds the public key as a signer on their account on-chain, posts the secret to `POST /workflows/:id/sessions` with a `{pair, maxNotional, ttl}` policy. Backend AES-GCM-encrypts it, stores it. On `start`, the engine decrypts it into memory, and on every tick the arbitrage strategy signs `manageBuyOffer` ops with that keypair and submits to Horizon — gated by liveness, policy match, dry-run flag, edge ≥ threshold, and supported direction. The on-chain signer weights are the *real* security boundary; everything in the app is policy-on-top.

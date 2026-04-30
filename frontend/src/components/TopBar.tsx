import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  Check,
  Wallet,
  Play,
  Square,
  Save,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGraphStore } from "../store/graphStore";
import { useWalletStore } from "../store/walletStore";
import { toWorkflowJson } from "../lib/workflowSerializer";
import {
  createWorkflow,
  getStatus,
  getWorkflow,
  listWorkflows,
  startWorkflow,
  stopWorkflow,
} from "../api/workflows";
import { subscribeEvents, type LiveEvent } from "../api/events";
import type { Workflow } from "@shared/types";
import WalletModal from "./WalletModal";
import SessionAuthorizeModal from "./SessionAuthorizeModal";
import Button from "../ui/Button";
import Chip from "../ui/Chip";
import Badge from "../ui/Badge";
import LogoMark from "../ui/LogoMark";
import { toast } from "../ui/toastStore";

const H = 56;

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  height: H,
  padding: "0 18px",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-panel)",
  zIndex: 20,
  flexShrink: 0,
  position: "relative",
};

const divider: CSSProperties = {
  width: 1,
  height: 22,
  background: "var(--hairline)",
  flexShrink: 0,
};

const nameInputStyle: CSSProperties = {
  padding: "6px 10px",
  border: "1px solid transparent",
  borderRadius: "var(--radius-sm)",
  background: "transparent",
  color: "var(--text)",
  fontSize: 13,
  fontWeight: 500,
  minWidth: 220,
  outline: "none",
  letterSpacing: "-0.1px",
  transition: "background-color var(--dur-fast), border-color var(--dur-fast)",
};

const menuStyle: CSSProperties = {
  position: "absolute",
  top: 38,
  right: 0,
  minWidth: 260,
  maxHeight: 320,
  overflowY: "auto",
  padding: 4,
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-pop)",
  zIndex: 40,
  animation: "flowpay-fade-in 140ms var(--ease-out)",
};

const menuItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 10px",
  borderRadius: "var(--radius-xs)",
  fontSize: 13,
  color: "var(--text)",
  cursor: "pointer",
  transition: "background-color var(--dur-fast)",
};

export interface BannerMessage {
  kind: "success" | "error";
  text: string;
}

function formatElapsed(startedAt: number, now: number): string {
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function deriveStrategyPair(
  nodes: ReturnType<typeof useGraphStore.getState>["nodes"],
  edges: ReturnType<typeof useGraphStore.getState>["edges"]
): { pair: string; notional: number; dryRun: boolean } | null {
  const strategy = nodes.find((n) => n.data.kind === "strategy");
  if (!strategy) return null;
  const params = strategy.data.params;
  const baseId = typeof params.baseAssetId === "string" ? params.baseAssetId : null;
  const quoteId = typeof params.quoteAssetId === "string" ? params.quoteAssetId : null;
  const assetLabel = (id: string | null) => {
    if (!id) return null;
    const n = nodes.find((m) => m.id === id);
    if (!n) return null;
    const code = String(n.data.params.code ?? "").trim().toUpperCase();
    if (!code) return null;
    const issuer = String(n.data.params.issuer ?? "").trim();
    if (code === "XLM" || code === "NATIVE") return "XLM";
    return issuer ? `${code}:${issuer}` : code;
  };
  const base = assetLabel(baseId);
  const quote = assetLabel(quoteId);
  let pair = "";
  if (base && quote) pair = `${base}/${quote}`;
  else if (typeof params.pair === "string") pair = params.pair;
  const notional = Number(params.notional ?? 100);
  const dryRun = Boolean(params.dryRun ?? true);
  void edges;
  return { pair, notional: Number.isFinite(notional) ? notional : 100, dryRun };
}

export default function TopBar(_props: {
  banner?: BannerMessage | null;
  setBanner?: (b: BannerMessage | null) => void;
}) {
  const name = useGraphStore((s) => s.name);
  const setName = useGraphStore((s) => s.setName);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const id = useGraphStore((s) => s.id);
  const setId = useGraphStore((s) => s.setId);
  const loadWorkflow = useGraphStore((s) => s.loadWorkflow);

  const publicKey = useWalletStore((s) => s.publicKey);
  const disconnect = useWalletStore((s) => s.disconnect);
  const sessionByWorkflow = useWalletStore((s) => s.sessionSignerIdByWorkflow);
  const rememberSession = useWalletStore((s) => s.rememberSession);
  const forgetSession = useWalletStore((s) => s.forgetSession);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [decisionCount, setDecisionCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<LiveEvent | null>(null);
  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const loadMenuRef = useRef<HTMLDivElement | null>(null);

  const refreshList = async () => {
    try {
      const list = await listWorkflows();
      setWorkflows(list);
    } catch (err) {
      toast.error(`Failed to list: ${(err as Error).message}`);
    }
  };

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRunning(false);
    setStartedAt(null);
    setTickCount(0);
    setDecisionCount(0);
    setLastEvent(null);
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [id]);

  useEffect(() => {
    if (!running || !id) return;
    setTickCount(0);
    setDecisionCount(0);
    const unsub = subscribeEvents(id, (e) => {
      setLastEvent(e);
      if (e.kind === "tick") setTickCount((n) => n + 1);
      else if (e.kind === "decision") setDecisionCount((n) => n + 1);
    });
    return () => unsub();
  }, [running, id]);

  useEffect(() => {
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, []);

  useEffect(() => {
    if (running && startedAt !== null) {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    } else if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [running, startedAt]);

  useEffect(() => {
    if (!loadMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (loadMenuRef.current && !loadMenuRef.current.contains(e.target as Node)) {
        setLoadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [loadMenuOpen]);

  const beginPolling = (wid: string) => {
    if (pollRef.current !== null) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const s = await getStatus(wid);
        setRunning(s.running);
        setStartedAt(s.startedAt ?? null);
        if (!s.running && pollRef.current !== null) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        /* swallow */
      }
    }, 2000);
  };

  const canSave = name.trim().length > 0 && nodes.length > 0 && !saving;

  const onSave = async () => {
    setSaving(true);
    try {
      const json = toWorkflowJson({ id, name, nodes, edges });
      const result = await createWorkflow({
        name: json.name,
        nodes: json.nodes,
        edges: json.edges,
      });
      setId(result.id);
      toast.success(`Saved · ${result.id.slice(0, 8)}`);
      await refreshList();
    } catch (err) {
      toast.error(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const onLoad = async (wid: string) => {
    setLoadMenuOpen(false);
    if (!wid) return;
    try {
      const wf = await getWorkflow(wid);
      loadWorkflow(wf);
      try {
        const s = await getStatus(wf.id);
        setRunning(s.running);
        setStartedAt(s.startedAt ?? null);
        if (s.running) beginPolling(wf.id);
      } catch {
        /* no-op */
      }
      toast.success(`Loaded · ${wf.name}`);
    } catch (err) {
      toast.error(`Load failed: ${(err as Error).message}`);
    }
  };

  const doStart = async (sessionSignerId: string | null) => {
    if (!id) return;
    try {
      const r = await startWorkflow(id, { sessionSignerId });
      setRunning(true);
      setStartedAt(r.startedAt);
      setNow(Date.now());
      beginPolling(id);
      if (r.alreadyRunning) {
        toast.info("Already running");
      } else {
        const isDry = deriveStrategyPair(nodes, edges)?.dryRun ?? true;
        toast.success(
          isDry
            ? "Dry run started — watch the activity panel below for ticks & decisions"
            : "Live run started — trades will execute within session policy"
        );
      }
    } catch (err) {
      toast.error(`Start failed: ${(err as Error).message}`);
    }
  };

  const onStart = async () => {
    if (!id) return;
    const derived = deriveStrategyPair(nodes, edges);
    const needsSession = derived?.dryRun === false;
    if (needsSession) {
      if (!publicKey) {
        toast.error("Connect wallet before live trading");
        setWalletModalOpen(true);
        return;
      }
      const existing = id ? sessionByWorkflow[id] : null;
      if (!existing) {
        setSessionModalOpen(true);
        return;
      }
      await doStart(existing);
      return;
    }
    await doStart(null);
  };

  const onStop = async () => {
    if (!id) return;
    try {
      await stopWorkflow(id);
      setRunning(false);
      setStartedAt(null);
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (err) {
      toast.error(`Stop failed: ${(err as Error).message}`);
    }
  };

  const onDisconnect = () => {
    if (id) forgetSession(id);
    disconnect();
    toast.info("Wallet disconnected");
  };

  const canStart = !!id && !running;
  const canStop = !!id && running;

  const elapsed = useMemo(
    () => (startedAt !== null ? formatElapsed(startedAt, now) : "00:00"),
    [startedAt, now]
  );

  const derived = useMemo(() => deriveStrategyPair(nodes, edges), [nodes, edges]);

  return (
    <>
      <style>{`
        .flowpay-name-input:hover { background-color: var(--bg-hover); }
        .flowpay-name-input:focus { background-color: var(--bg-hover); border-color: var(--border) !important; }
      `}</style>

      <div style={headerStyle}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 18,
            color: "var(--text)",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          <LogoMark />
          spay
        </Link>

        <div style={divider} />

        <input
          className="flowpay-name-input"
          style={nameInputStyle}
          placeholder="Untitled workflow"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div style={{ flex: 1 }} />

        {running && startedAt !== null && (
          <>
            <Badge tone={derived?.dryRun === false ? "amber" : "mint"} dot>
              {derived?.dryRun === false ? "LIVE" : "DRY"}
            </Badge>
            <Badge tone="violet" mono>
              {elapsed}
            </Badge>
            <span
              title="Ticks fired · decisions emitted"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              {tickCount}t · {decisionCount}d
            </span>
            {lastEvent && (
              <span
                title={lastEvent.message}
                style={{
                  fontSize: 11.5,
                  color: "var(--text-dim)",
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lastEvent.message}
              </span>
            )}
          </>
        )}

        {publicKey ? (
          <Chip
            onClick={onDisconnect}
            title="Click to disconnect"
            dot="mint"
            mono
            trailingIcon={<LogOut size={11} />}
          >
            {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
          </Chip>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Wallet size={13} />}
            onClick={() => setWalletModalOpen(true)}
          >
            Connect wallet
          </Button>
        )}

        <div style={divider} />

        <div ref={loadMenuRef} style={{ position: "relative" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLoadMenuOpen((v) => !v)}
            trailingIcon={<ChevronDown size={13} />}
          >
            Load
          </Button>
          {loadMenuOpen && (
            <div style={menuStyle}>
              {workflows.length === 0 ? (
                <div
                  style={{
                    padding: "10px 12px",
                    fontSize: 12.5,
                    color: "var(--text-dim)",
                  }}
                >
                  No saved workflows
                </div>
              ) : (
                workflows.map((w) => (
                  <div
                    key={w.id}
                    style={menuItemStyle}
                    onClick={() => onLoad(w.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {w.name}
                    </span>
                    <span
                      className="fp-mono"
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                      }}
                    >
                      {w.id === id ? (
                        <Check size={12} color="var(--mint)" />
                      ) : (
                        w.id.slice(0, 6)
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Save size={13} />}
          disabled={!canSave}
          loading={saving}
          onClick={onSave}
        >
          Save
        </Button>

        {!running ? (
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Play size={13} />}
            disabled={!canStart}
            onClick={onStart}
          >
            Start
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            leadingIcon={<Square size={13} />}
            disabled={!canStop}
            onClick={onStop}
          >
            Stop
          </Button>
        )}
      </div>

      <WalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
      {id && derived && (
        <SessionAuthorizeModal
          open={sessionModalOpen}
          workflowId={id}
          pair={derived.pair}
          defaultNotional={derived.notional}
          onClose={() => setSessionModalOpen(false)}
          onAuthorized={(sid) => {
            rememberSession(id, sid);
            setSessionModalOpen(false);
            void doStart(sid);
          }}
        />
      )}
    </>
  );
}

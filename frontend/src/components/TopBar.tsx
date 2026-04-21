import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, Check, Wallet } from "lucide-react";
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
import type { Workflow } from "@shared/types";
import WalletModal from "./WalletModal";
import SessionAuthorizeModal from "./SessionAuthorizeModal";

const H = 48;

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  height: H,
  padding: "0 18px",
  borderBottom: "1px solid #e4e4e7",
  backgroundColor: "#ffffff",
  zIndex: 20,
  flexShrink: 0,
  position: "relative",
};

const brandStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: "-0.4px",
  color: "#09090b",
};

const divider: CSSProperties = {
  width: 1,
  height: 18,
  background: "#e4e4e7",
};

const nameInputStyle: CSSProperties = {
  padding: "4px 6px",
  border: "1px solid transparent",
  borderRadius: 6,
  backgroundColor: "transparent",
  color: "#09090b",
  fontSize: 13,
  fontWeight: 500,
  minWidth: 200,
  outline: "none",
  letterSpacing: "-0.2px",
  transition: "background-color 120ms, border-color 120ms",
};

const ctrlBase: CSSProperties = {
  height: 30,
  padding: "0 12px",
  borderRadius: 6,
  border: "1px solid #e4e4e7",
  backgroundColor: "#ffffff",
  color: "#09090b",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "background-color 120ms, border-color 120ms",
  whiteSpace: "nowrap",
};

const primary = (enabled: boolean): CSSProperties => ({
  ...ctrlBase,
  border: "1px solid #09090b",
  backgroundColor: enabled ? "#09090b" : "#d4d4d8",
  color: "#ffffff",
  cursor: enabled ? "pointer" : "not-allowed",
});

const ghost = (enabled: boolean): CSSProperties => ({
  ...ctrlBase,
  color: enabled ? "#09090b" : "#a1a1aa",
  cursor: enabled ? "pointer" : "not-allowed",
});

const walletChip: CSSProperties = {
  ...ctrlBase,
  backgroundColor: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#065f46",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: 12,
};

const runIndicator: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "0 10px",
  height: 30,
  borderRadius: 6,
  border: "1px solid #e4e4e7",
  color: "#09090b",
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const runDot: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: "#09090b",
  animation: "flowpay-pulse 1.6s infinite cubic-bezier(0.4, 0, 0.6, 1)",
};

const toastStyle = (kind: "success" | "error"): CSSProperties => ({
  position: "fixed",
  top: H + 12,
  right: 18,
  maxWidth: 360,
  padding: "8px 12px",
  borderRadius: 8,
  backgroundColor: "#ffffff",
  border: `1px solid ${kind === "success" ? "#e4e4e7" : "#fecaca"}`,
  color: kind === "success" ? "#09090b" : "#991b1b",
  fontSize: 12.5,
  fontWeight: 500,
  boxShadow: "0 4px 16px rgba(9,9,11,0.08)",
  display: "flex",
  alignItems: "center",
  gap: 8,
  zIndex: 50,
});

const menuStyle: CSSProperties = {
  position: "absolute",
  top: 36,
  right: 0,
  minWidth: 240,
  maxHeight: 300,
  overflowY: "auto",
  padding: 4,
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(9,9,11,0.08)",
  zIndex: 40,
};

const menuItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "7px 10px",
  borderRadius: 6,
  fontSize: 13,
  color: "#09090b",
  cursor: "pointer",
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

export default function TopBar({
  banner,
  setBanner,
}: {
  banner: BannerMessage | null;
  setBanner: (b: BannerMessage | null) => void;
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
  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const loadMenuRef = useRef<HTMLDivElement | null>(null);

  const refreshList = async () => {
    try {
      const list = await listWorkflows();
      setWorkflows(list);
    } catch (err) {
      setBanner({ kind: "error", text: `Failed to list: ${(err as Error).message}` });
    }
  };

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRunning(false);
    setStartedAt(null);
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [id]);

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
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 3200);
    return () => window.clearTimeout(t);
  }, [banner, setBanner]);

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
    setBanner(null);
    try {
      const json = toWorkflowJson({ id, name, nodes, edges });
      const result = await createWorkflow({
        name: json.name,
        nodes: json.nodes,
        edges: json.edges,
      });
      setId(result.id);
      setBanner({ kind: "success", text: `Saved · ${result.id.slice(0, 8)}` });
      await refreshList();
    } catch (err) {
      setBanner({ kind: "error", text: `Save failed: ${(err as Error).message}` });
    } finally {
      setSaving(false);
    }
  };

  const onLoad = async (wid: string) => {
    setLoadMenuOpen(false);
    if (!wid) return;
    setBanner(null);
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
      setBanner({ kind: "success", text: `Loaded · ${wf.name}` });
    } catch (err) {
      setBanner({ kind: "error", text: `Load failed: ${(err as Error).message}` });
    }
  };

  const doStart = async (sessionSignerId: string | null) => {
    if (!id) return;
    setBanner(null);
    try {
      const r = await startWorkflow(id, { sessionSignerId });
      setRunning(true);
      setStartedAt(r.startedAt);
      setNow(Date.now());
      beginPolling(id);
      if (r.alreadyRunning) {
        setBanner({ kind: "success", text: "Already running" });
      }
    } catch (err) {
      setBanner({ kind: "error", text: `Start failed: ${(err as Error).message}` });
    }
  };

  const onStart = async () => {
    if (!id) return;
    const derived = deriveStrategyPair(nodes, edges);
    const needsSession = derived?.dryRun === false;
    if (needsSession) {
      if (!publicKey) {
        setBanner({ kind: "error", text: "Connect wallet before live trading" });
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
    setBanner(null);
    try {
      await stopWorkflow(id);
      setRunning(false);
      setStartedAt(null);
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (err) {
      setBanner({ kind: "error", text: `Stop failed: ${(err as Error).message}` });
    }
  };

  const onDisconnect = () => {
    if (id) forgetSession(id);
    disconnect();
    setBanner({ kind: "success", text: "Wallet disconnected" });
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
        @keyframes flowpay-pulse {
          0% { box-shadow: 0 0 0 0 rgba(9, 9, 11, 0.35); }
          70% { box-shadow: 0 0 0 5px rgba(9, 9, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(9, 9, 11, 0); }
        }
        .flowpay-name-input:hover { background-color: #f4f4f5; }
        .flowpay-name-input:focus { background-color: #f4f4f5; border-color: #e4e4e7; }
        .flowpay-ctrl:hover:not(:disabled) { background-color: #f4f4f5; }
        .flowpay-primary:hover:not(:disabled) { background-color: #18181b !important; }
        .flowpay-menu-item:hover { background-color: #f4f4f5; }
      `}</style>

      <div style={headerStyle}>
        <div style={brandStyle}>FlowPay</div>
        <div style={divider} />
        <input
          className="flowpay-name-input"
          style={nameInputStyle}
          placeholder="Untitled workflow"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div style={{ flex: 1 }} />

        {publicKey ? (
          <button
            className="flowpay-ctrl"
            style={walletChip}
            onClick={onDisconnect}
            title="Click to disconnect"
          >
            <Wallet size={12} strokeWidth={2.25} />
            {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
          </button>
        ) : (
          <button
            className="flowpay-ctrl"
            style={ghost(true)}
            onClick={() => setWalletModalOpen(true)}
          >
            <Wallet size={14} strokeWidth={2} />
            Connect wallet
          </button>
        )}

        <div style={divider} />

        <div ref={loadMenuRef} style={{ position: "relative" }}>
          <button
            className="flowpay-ctrl"
            style={ghost(true)}
            onClick={() => setLoadMenuOpen((v) => !v)}
          >
            Load
            <ChevronDown size={14} strokeWidth={2} />
          </button>
          {loadMenuOpen && (
            <div style={menuStyle}>
              {workflows.length === 0 ? (
                <div
                  style={{
                    padding: "10px 12px",
                    fontSize: 12.5,
                    color: "#a1a1aa",
                  }}
                >
                  No saved workflows
                </div>
              ) : (
                workflows.map((w) => (
                  <div
                    key={w.id}
                    className="flowpay-menu-item"
                    style={menuItemStyle}
                    onClick={() => onLoad(w.id)}
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
                      style={{
                        fontSize: 11,
                        color: "#a1a1aa",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      }}
                    >
                      {w.id === id ? <Check size={12} /> : w.id.slice(0, 6)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          className="flowpay-ctrl flowpay-primary"
          style={primary(canSave)}
          disabled={!canSave}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save"}
        </button>

        <div style={divider} />

        {running && startedAt !== null && (
          <div style={runIndicator}>
            <span style={runDot} />
            {elapsed}
          </div>
        )}

        {!running ? (
          <button
            className="flowpay-ctrl flowpay-primary"
            style={primary(canStart)}
            disabled={!canStart}
            onClick={onStart}
          >
            Start
          </button>
        ) : (
          <button
            className="flowpay-ctrl"
            style={{ ...ctrlBase, border: "1px solid #09090b", color: "#09090b" }}
            disabled={!canStop}
            onClick={onStop}
          >
            Stop
          </button>
        )}
      </div>

      {banner && (
        <div style={toastStyle(banner.kind)} onClick={() => setBanner(null)}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: banner.kind === "success" ? "#059669" : "#dc2626",
            }}
          />
          {banner.text}
        </div>
      )}

      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
      {sessionModalOpen && id && derived && (
        <SessionAuthorizeModal
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

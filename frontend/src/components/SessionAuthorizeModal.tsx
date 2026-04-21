import { type CSSProperties, useMemo, useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { ShieldCheck, X } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { createSession, type SessionPolicy } from "../api/workflows";

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(9,9,11,0.32)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const dialog: CSSProperties = {
  width: 460,
  maxWidth: "calc(100% - 32px)",
  backgroundColor: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e4e4e7",
  boxShadow: "0 12px 32px rgba(9,9,11,0.12)",
};

const header: CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #e4e4e7",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 14,
  fontWeight: 600,
};

const body: CSSProperties = {
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const rowLabel: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "#71717a",
  fontWeight: 600,
  marginBottom: 4,
};

const rowValue: CSSProperties = {
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  color: "#09090b",
};

const policyBox: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  backgroundColor: "#fafafa",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const primary: CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 8,
  backgroundColor: "#09090b",
  color: "#ffffff",
  border: "1px solid #09090b",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  justifyContent: "center",
};

const ghost: CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 6,
  backgroundColor: "#ffffff",
  color: "#09090b",
  border: "1px solid #e4e4e7",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #fecaca",
  backgroundColor: "#fef2f2",
  color: "#991b1b",
  fontSize: 12.5,
};

export default function SessionAuthorizeModal({
  workflowId,
  pair,
  defaultNotional,
  onClose,
  onAuthorized,
}: {
  workflowId: string;
  pair: string;
  defaultNotional: number;
  onClose: () => void;
  onAuthorized: (sessionSignerId: string) => void;
}) {
  const ownerAccount = useWalletStore((s) => s.publicKey);
  const rememberSession = useWalletStore((s) => s.rememberSession);

  const sessionKeypair = useMemo(() => Keypair.random(), []);
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [maxNotional, setMaxNotional] = useState<number>(
    Math.max(defaultNotional, 100)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ownerAccount) {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={dialog} onClick={(e) => e.stopPropagation()}>
          <div style={header}>
            Authorize session
            <button
              onClick={onClose}
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div style={body}>
            <div style={errorStyle}>Connect a wallet first.</div>
          </div>
        </div>
      </div>
    );
  }

  const onAuthorize = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const policy: SessionPolicy = { pair, maxNotional };
      const result = await createSession(workflowId, {
        ownerAccount,
        secretKey: sessionKeypair.secret(),
        policy,
        ttlMinutes,
      });
      rememberSession(workflowId, result.id);
      onAuthorized(result.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span>Authorize automation</span>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#71717a" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={body}>
          <p style={{ margin: 0, fontSize: 13, color: "#3f3f46", lineHeight: 1.5 }}>
            A one-time ephemeral session key is created on this device. FlowPay
            uses it to sign trades automatically while the workflow runs — no
            per-trade popups. The key is scoped, short-lived, and revocable.
          </p>

          <div style={policyBox}>
            <div>
              <div style={rowLabel}>Owner account</div>
              <div style={rowValue}>
                {ownerAccount.slice(0, 8)}…{ownerAccount.slice(-6)}
              </div>
            </div>
            <div>
              <div style={rowLabel}>Session public key</div>
              <div style={rowValue}>
                {sessionKeypair.publicKey().slice(0, 8)}…
                {sessionKeypair.publicKey().slice(-6)}
              </div>
            </div>
            <div>
              <div style={rowLabel}>Trading pair</div>
              <div style={rowValue}>{pair || "— set assets first —"}</div>
            </div>

            <div>
              <div style={rowLabel}>Max notional per tick</div>
              <input
                type="number"
                min={1}
                value={maxNotional}
                onChange={(e) => setMaxNotional(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #e4e4e7",
                  borderRadius: 6,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <div style={rowLabel}>Expires in (minutes)</div>
              <input
                type="number"
                min={5}
                max={240}
                value={ttlMinutes}
                onChange={(e) => setTtlMinutes(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #e4e4e7",
                  borderRadius: 6,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button style={ghost} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              style={primary}
              onClick={onAuthorize}
              disabled={submitting || !pair}
            >
              <ShieldCheck size={14} />
              {submitting ? "Authorizing…" : "Authorize session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

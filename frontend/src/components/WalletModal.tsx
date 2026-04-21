import { type CSSProperties, useState } from "react";
import { X, Wallet } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { connectFreighter } from "../lib/freighter";

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
  width: 420,
  maxWidth: "calc(100% - 32px)",
  backgroundColor: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e4e4e7",
  boxShadow: "0 12px 32px rgba(9,9,11,0.12)",
  overflow: "hidden",
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

export default function WalletModal({ onClose }: { onClose: () => void }) {
  const setConnecting = useWalletStore((s) => s.setConnecting);
  const setWallet = useWalletStore((s) => s.setWallet);
  const connecting = useWalletStore((s) => s.connecting);
  const [localError, setLocalError] = useState<string | null>(null);

  const onConnect = async () => {
    setLocalError(null);
    setConnecting(true);
    try {
      const { publicKey, network } = await connectFreighter();
      setWallet(publicKey, network);
      onClose();
    } catch (err) {
      setLocalError((err as Error).message);
      setConnecting(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <span>Connect wallet</span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#71717a",
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={body}>
          <p style={{ margin: 0, fontSize: 13, color: "#3f3f46", lineHeight: 1.5 }}>
            FlowPay uses Freighter to identify your Stellar account. You&apos;ll
            still authorize a short-lived session key before any workflow can
            trade on your behalf — Freighter never gets popped per trade.
          </p>

          {localError && <div style={errorStyle}>{localError}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button style={ghost} onClick={onClose} disabled={connecting}>
              Cancel
            </button>
            <button style={primary} onClick={onConnect} disabled={connecting}>
              <Wallet size={14} />
              {connecting ? "Connecting…" : "Connect Freighter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

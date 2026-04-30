import { useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { connectFreighter } from "../lib/freighter";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function WalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
    <Modal
      open={open}
      onClose={onClose}
      title="Connect wallet"
      description="spay uses Freighter to identify your Stellar account. You'll authorize a scoped session key before any workflow trades — Freighter never pops per trade."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={connecting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConnect}
            loading={connecting}
            leadingIcon={<Wallet size={14} />}
          >
            Connect Freighter
          </Button>
        </>
      }
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: 12,
          background: "var(--bg-sunken)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          fontSize: 12.5,
          color: "var(--text-muted)",
          lineHeight: 1.55,
        }}
      >
        <ShieldCheck
          size={16}
          style={{ color: "var(--mint)", flexShrink: 0, marginTop: 1 }}
        />
        <div>
          Your keys stay in Freighter. spay only sees your public address
          until you authorize a session.
        </div>
      </div>

      {localError && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(255,107,107,0.4)",
            background: "var(--danger-soft)",
            color: "var(--danger)",
            fontSize: 12.5,
          }}
        >
          {localError}
        </div>
      )}
    </Modal>
  );
}

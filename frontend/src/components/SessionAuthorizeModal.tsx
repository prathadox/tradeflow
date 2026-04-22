import { useMemo, useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { ShieldCheck } from "lucide-react";
import { useWalletStore } from "../store/walletStore";
import { createSession, type SessionPolicy } from "../api/workflows";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Field from "../ui/Field";

export default function SessionAuthorizeModal({
  open,
  workflowId,
  pair,
  defaultNotional,
  onClose,
  onAuthorized,
}: {
  open: boolean;
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

  if (!open) return null;

  if (!ownerAccount) {
    return (
      <Modal open={open} onClose={onClose} title="Authorize session">
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
          Connect a wallet first.
        </div>
      </Modal>
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
    <Modal
      open={open}
      onClose={onClose}
      title="Authorize automation"
      description="An ephemeral session key signs trades while the workflow runs. Scoped, short-lived, revocable — no per-trade popups."
      width={500}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onAuthorize}
            loading={submitting}
            disabled={!pair}
            leadingIcon={<ShieldCheck size={14} />}
          >
            Authorize session
          </Button>
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: 14,
          background: "var(--bg-sunken)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <KeyValue label="Owner account" value={fmtKey(ownerAccount)} mono />
        <KeyValue
          label="Session public key"
          value={fmtKey(sessionKeypair.publicKey())}
          mono
        />
        <KeyValue
          label="Trading pair"
          value={pair || "— set assets first —"}
          mono
        />
        <KeyValue label="Wallet" value="Freighter" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Max notional per tick">
          <Input
            type="number"
            min={1}
            value={maxNotional}
            onChange={(e) => setMaxNotional(Number(e.target.value))}
          />
        </Field>

        <Field label="Expires in (minutes)">
          <Input
            type="number"
            min={5}
            max={240}
            value={ttlMinutes}
            onChange={(e) => setTtlMinutes(Number(e.target.value))}
          />
        </Field>
      </div>

      {error && (
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
          {error}
        </div>
      )}
    </Modal>
  );
}

function fmtKey(k: string): string {
  return `${k.slice(0, 6)}…${k.slice(-6)}`;
}

function KeyValue({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.9px",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--text)",
          fontFamily: mono ? "var(--font-mono)" : "inherit",
        }}
      >
        {value}
      </div>
    </div>
  );
}

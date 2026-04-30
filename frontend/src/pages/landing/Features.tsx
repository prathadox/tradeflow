import type { ReactNode } from "react";
import {
  Workflow,
  ShieldCheck,
  Activity,
  History,
  Gauge,
  Wallet,
} from "lucide-react";
import { SectionHead } from "./HowItWorks";

const section: React.CSSProperties = {
  padding: "56px 24px 64px",
  maxWidth: 1100,
  margin: "0 auto",
};

const features: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <Workflow size={16} />,
    title: "Visual workflow builder",
    body:
      "Compose triggers, strategies, and actions on a canvas. Save, load, version.",
  },
  {
    icon: <ShieldCheck size={16} />,
    title: "Session-signer AA",
    body:
      "Ephemeral keys scoped by pair, notional, and TTL. Revoke in one click. Your main account stays cold.",
  },
  {
    icon: <Activity size={16} />,
    title: "Live activity stream",
    body:
      "Server-sent events for every tick, decision, and error. No polling. No refresh.",
  },
  {
    icon: <History size={16} />,
    title: "Runs history",
    body:
      "Every run is persisted with its event log. Replay, inspect, export. Full audit trail.",
  },
  {
    icon: <Gauge size={16} />,
    title: "Policy caps",
    body:
      "Hard max per trade, hard max per session. Re-validated on every tick backend-side.",
  },
  {
    icon: <Wallet size={16} />,
    title: "Freighter-native",
    body:
      "Works with the wallet you already have. Testnet today, mainnet coming soon.",
  },
];

export default function Features() {
  return (
    <section id="features" style={section}>
      <SectionHead
        eyebrow="Features"
        title="Built for people who'd rather not babysit bots."
        sub="The primitives you'd expect from a quant stack — minus the terminal."
      />
      <style>{`
        .fp-features-grid {
          margin-top: 40px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 920px) {
          .fp-features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .fp-features-grid { grid-template-columns: minmax(0, 1fr); }
        }
        .fp-feature-card {
          padding: 22px;
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color var(--dur-fast), transform var(--dur-fast);
        }
        .fp-feature-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }
      `}</style>
      <div className="fp-features-grid">
        {features.map((f) => (
          <div key={f.title} className="fp-feature-card">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                background: "var(--accent-soft)",
                color: "var(--accent)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(124,92,255,0.3)",
              }}
            >
              {f.icon}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text)",
                marginTop: 4,
                letterSpacing: "-0.15px",
              }}
            >
              {f.title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              {f.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { ReactNode } from "react";
import { MousePointer2, ShieldCheck, Zap } from "lucide-react";

const section: React.CSSProperties = {
  padding: "72px 24px",
  maxWidth: 1200,
  margin: "0 auto",
};

const steps: {
  icon: ReactNode;
  title: string;
  body: string;
  num: string;
}[] = [
  {
    num: "01",
    icon: <MousePointer2 size={16} />,
    title: "Wire it",
    body:
      "Drop a time trigger, pick a strategy, connect your assets. Everything on a canvas. No code, no YAML.",
  },
  {
    num: "02",
    icon: <ShieldCheck size={16} />,
    title: "Authorize once",
    body:
      "Connect Freighter, approve a scoped session key (pair, notional cap, TTL). That is the last popup you will see.",
  },
  {
    num: "03",
    icon: <Zap size={16} />,
    title: "Let it run",
    body:
      "FlowPay watches the spread and submits on-chain trades for you. Stream of events, history of runs, audit trail.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={section}>
      <SectionHead
        eyebrow="How it works"
        title="From drag to live in three steps."
        sub="No watching the tape. No bot scripts. No custodians."
      />
      <div
        style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {steps.map((s) => (
          <div
            key={s.num}
            style={{
              padding: 22,
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-dim)",
                letterSpacing: "0.5px",
              }}
            >
              {s.num}
            </div>
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
              {s.icon}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.2px",
                marginTop: 4,
              }}
            >
              {s.title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              {s.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
        textAlign: "center",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 4.2vw, 48px)",
          fontWeight: 400,
          letterSpacing: "-0.02em",
          color: "var(--text)",
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            color: "var(--text-muted)",
            lineHeight: 1.6,
            maxWidth: 560,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

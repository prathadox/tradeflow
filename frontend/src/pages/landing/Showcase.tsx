import { Clock, TrendingUp, Coins, ArrowLeftRight } from "lucide-react";
import { SectionHead } from "./HowItWorks";

const section: React.CSSProperties = {
  padding: "72px 24px",
  maxWidth: 1200,
  margin: "0 auto",
};

const frame: React.CSSProperties = {
  marginTop: 32,
  background: "var(--bg-panel)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-pop)",
  overflow: "hidden",
};

const topbar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderBottom: "1px solid var(--hairline)",
  background: "var(--bg-elev)",
};

const dotGrid: React.CSSProperties = {
  position: "relative",
  height: 320,
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
  backgroundSize: "18px 18px",
  overflow: "hidden",
};

export default function Showcase() {
  return (
    <section style={section}>
      <SectionHead
        eyebrow="The builder"
        title="A canvas, not a config file."
        sub="Zoom, pan, connect. The same mental model as Figma or Linear."
      />
      <div style={frame}>
        <div style={topbar}>
          <span style={dotStyle("var(--danger)")} />
          <span style={dotStyle("var(--amber)")} />
          <span style={dotStyle("var(--mint)")} />
          <div
            style={{
              marginLeft: 12,
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            flowpay.xyz/app — xlm arbitrage
          </div>
        </div>
        <div style={dotGrid}>
          <FlowCard
            style={{ left: "6%", top: "18%" }}
            icon={<Clock size={14} />}
            tint="violet"
            title="Time trigger"
            subtitle="Every 10s"
          />
          <FlowCard
            style={{ left: "34%", top: "12%" }}
            icon={<Coins size={14} />}
            tint="neutral"
            title="XLM"
            subtitle="native"
          />
          <FlowCard
            style={{ left: "34%", top: "56%" }}
            icon={<Coins size={14} />}
            tint="neutral"
            title="USDC"
            subtitle="GA5Z…KZVN"
          />
          <FlowCard
            style={{ left: "60%", top: "34%" }}
            icon={<TrendingUp size={14} />}
            tint="amber"
            title="Arbitrage"
            subtitle="thr 0.02 · dry"
          />
          <FlowCard
            style={{ left: "84%", top: "34%" }}
            icon={<ArrowLeftRight size={14} />}
            tint="mint"
            title="Trade"
            subtitle="XLM → USDC"
          />

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <path
              d="M 18 26 C 32 26, 32 42, 58 42"
              stroke="rgba(124,92,255,0.6)"
              strokeWidth="0.3"
              fill="none"
            />
            <path
              d="M 44 22 C 54 22, 54 42, 58 42"
              stroke="rgba(154,163,178,0.4)"
              strokeWidth="0.3"
              fill="none"
            />
            <path
              d="M 44 64 C 54 64, 54 42, 58 42"
              stroke="rgba(154,163,178,0.4)"
              strokeWidth="0.3"
              fill="none"
            />
            <path
              d="M 68 42 C 76 42, 76 42, 82 42"
              stroke="rgba(34,211,168,0.6)"
              strokeWidth="0.3"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

function dotStyle(color: string): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
  };
}

function FlowCard({
  icon,
  tint,
  title,
  subtitle,
  style,
}: {
  icon: React.ReactNode;
  tint: "violet" | "mint" | "amber" | "neutral";
  title: string;
  subtitle: string;
  style?: React.CSSProperties;
}) {
  const tintVar =
    tint === "violet"
      ? "var(--accent)"
      : tint === "mint"
      ? "var(--mint)"
      : tint === "amber"
      ? "var(--amber)"
      : "var(--text-muted)";
  const tintBg =
    tint === "violet"
      ? "var(--accent-soft)"
      : tint === "mint"
      ? "var(--mint-soft)"
      : tint === "amber"
      ? "var(--amber-soft)"
      : "var(--kind-asset-soft)";
  return (
    <div
      style={{
        position: "absolute",
        transform: "translate(-50%, -50%)",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${tintVar}`,
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-lift)",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: 6,
          background: tintBg,
          color: tintVar,
        }}
      >
        {icon}
      </span>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

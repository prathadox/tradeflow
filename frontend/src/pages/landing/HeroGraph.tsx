import {
  Clock,
  TrendingUp,
  ArrowLeftRight,
  Coins,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

const boxStyle: CSSProperties = {
  position: "absolute",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px 10px 12px",
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-lift)",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--text)",
  whiteSpace: "nowrap",
  transform: "translate(-50%, -50%)",
};

const iconTile: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  borderRadius: 5,
  background: "var(--bg-sunken)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  flexShrink: 0,
};

interface NodePos {
  x: number;
  y: number;
  icon: ReactNode;
  title: string;
  subtitle: string;
  accent?: "edge" | "muted";
}

const NODES: NodePos[] = [
  { x: 14, y: 28, icon: <Clock size={14} />, title: "Every 10s", subtitle: "Time trigger" },
  { x: 28, y: 66, icon: <Coins size={14} />, title: "XLM", subtitle: "native", accent: "muted" },
  { x: 52, y: 46, icon: <TrendingUp size={14} />, title: "Arbitrage", subtitle: "thr 0.02" },
  { x: 38, y: 86, icon: <Coins size={14} />, title: "USDC", subtitle: "GA5Z…KZVN", accent: "muted" },
  { x: 84, y: 52, icon: <ArrowLeftRight size={14} />, title: "Trade", subtitle: "Session-signed" },
];

interface EdgeDef {
  from: number;
  to: number;
}

const EDGES: EdgeDef[] = [
  { from: 0, to: 2 },
  { from: 1, to: 2 },
  { from: 3, to: 2 },
  { from: 2, to: 4 },
];

export default function HeroGraph() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
      }}
    >
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
        {EDGES.map((e, i) => {
          const a = NODES[e.from];
          const b = NODES[e.to];
          const midX = (a.x + b.x) / 2;
          return (
            <path
              key={i}
              d={`M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.22"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {NODES.map((n, i) => (
        <div
          key={i}
          style={{
            ...boxStyle,
            left: `${n.x}%`,
            top: `${n.y}%`,
            opacity: n.accent === "muted" ? 0.92 : 1,
          }}
        >
          <span style={iconTile}>{n.icon}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{n.title}</span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                fontWeight: 500,
                fontFamily:
                  n.accent === "muted" ? "var(--font-mono)" : "inherit",
              }}
            >
              {n.subtitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

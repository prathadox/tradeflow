import type { CSSProperties, ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "violet"
  | "mint"
  | "amber"
  | "red"
  | "blue";

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  mono?: boolean;
  style?: CSSProperties;
}

const TONE: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  neutral: {
    bg: "var(--bg-sunken)",
    fg: "var(--text-muted)",
    border: "var(--border)",
  },
  violet: {
    bg: "var(--accent-soft)",
    fg: "var(--text)",
    border: "var(--border-strong)",
  },
  mint: {
    bg: "var(--bg-sunken)",
    fg: "var(--text)",
    border: "var(--border-strong)",
  },
  amber: {
    bg: "var(--bg-sunken)",
    fg: "var(--text-muted)",
    border: "var(--border)",
  },
  red: {
    bg: "var(--danger-soft)",
    fg: "var(--danger)",
    border: "rgba(248, 113, 113, 0.32)",
  },
  blue: {
    bg: "var(--bg-sunken)",
    fg: "var(--text-muted)",
    border: "var(--border)",
  },
};

export default function Badge({
  tone = "neutral",
  dot,
  children,
  mono,
  style,
}: BadgeProps) {
  const t = TONE[tone];
  const merged: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 22,
    padding: "0 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: mono ? 0 : "0.2px",
    color: t.fg,
    background: t.bg,
    border: `1px solid ${t.border}`,
    fontFamily: mono ? "var(--font-mono)" : "inherit",
    whiteSpace: "nowrap",
    ...style,
  };
  return (
    <span style={merged}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: t.fg,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

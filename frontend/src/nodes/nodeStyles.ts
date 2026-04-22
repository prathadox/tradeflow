import type { CSSProperties } from "react";
import type { NodeKind } from "../store/graphStore";

// Subtle accent per node kind — tints icon tile + the card's left border.
export const NODE_ACCENT: Record<NodeKind, string> = {
  trigger: "var(--kind-trigger)",
  strategy: "var(--kind-strategy)",
  action: "var(--kind-action)",
  asset: "var(--kind-asset)",
};

const TILE_BG: Record<NodeKind, string> = {
  trigger: "var(--kind-trigger-soft)",
  strategy: "var(--kind-strategy-soft)",
  action: "var(--kind-action-soft)",
  asset: "var(--kind-asset-soft)",
};

export function accentTileStyle(
  kindOrAccent: NodeKind | string,
  size = 32
): CSSProperties {
  const isKind = (kindOrAccent as NodeKind) in TILE_BG;
  const kind = isKind ? (kindOrAccent as NodeKind) : null;
  return {
    width: size,
    height: size,
    borderRadius: "var(--radius-sm)",
    background: kind ? TILE_BG[kind] : "var(--bg-sunken)",
    border: `1px solid var(--border)`,
    color: kind ? NODE_ACCENT[kind] : "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}

export function truncateIssuer(issuer: string | undefined): string {
  if (!issuer) return "";
  if (issuer.length <= 10) return issuer;
  return `${issuer.slice(0, 4)}…${issuer.slice(-4)}`;
}

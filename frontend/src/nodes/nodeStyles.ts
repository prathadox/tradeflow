import type { CSSProperties } from "react";
import type { NodeKind } from "../store/graphStore";

// Subtle accent colour per node kind. Bodies stay neutral; only the icon tile +
// left border pick up the hue so categories are scannable without being loud.
export const NODE_ACCENT: Record<NodeKind, string> = {
  trigger: "#6366f1",
  strategy: "#d97706",
  action: "#059669",
  asset: "#52525b",
};

const TILE_BG: Record<NodeKind, string> = {
  trigger: "#eef2ff",
  strategy: "#fef3c7",
  action: "#d1fae5",
  asset: "#f4f4f5",
};

const TILE_BORDER: Record<NodeKind, string> = {
  trigger: "#e0e7ff",
  strategy: "#fde68a",
  action: "#a7f3d0",
  asset: "#e4e4e7",
};

export function accentTileStyle(kindOrAccent: NodeKind | string, size = 32): CSSProperties {
  const isKind = (kindOrAccent as NodeKind) in TILE_BG;
  const kind = isKind ? (kindOrAccent as NodeKind) : null;
  return {
    width: size,
    height: size,
    borderRadius: 8,
    backgroundColor: kind ? TILE_BG[kind] : "#f4f4f5",
    border: `1px solid ${kind ? TILE_BORDER[kind] : "#e4e4e7"}`,
    color: kind ? NODE_ACCENT[kind] : "#3f3f46",
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

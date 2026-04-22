import type { CSSProperties, ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeToolbar } from "./NodeToolbar";
import { accentTileStyle, NODE_ACCENT } from "./nodeStyles";
import type { NodeKind } from "../store/graphStore";

export interface NodeHandleDef {
  type: "source" | "target";
  position: Position;
  id?: string;
  size?: "sm" | "md";
}

interface BaseNodeProps {
  id: string;
  kind: NodeKind;
  selected: boolean;
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleMono?: boolean;
  handles: NodeHandleDef[];
  minWidth?: number;
}

export default function BaseNode({
  id,
  kind,
  selected,
  icon,
  title,
  subtitle,
  subtitleMono,
  handles,
  minWidth = 210,
}: BaseNodeProps) {
  const accent = NODE_ACCENT[kind];

  const cardStyle: CSSProperties = {
    position: "relative",
    background: "var(--bg-elev)",
    border: `1px solid ${selected ? accent : "var(--border)"}`,
    borderLeft: `3px solid ${accent}`,
    borderRadius: "var(--radius-md)",
    minWidth,
    padding: "12px 14px 12px 13px",
    boxShadow: selected ? "var(--shadow-pop)" : "var(--shadow-lift)",
    transition:
      "border-color var(--dur-fast), box-shadow var(--dur-fast), transform var(--dur-fast)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  return (
    <div style={cardStyle}>
      <NodeToolbar nodeId={id} />

      <div style={accentTileStyle(kind, 30)}>{icon}</div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.15px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        {subtitle !== undefined && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--text-dim)",
              fontFamily: subtitleMono ? "var(--font-mono)" : "inherit",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {handles.map((h, i) => (
        <Handle
          key={`${h.type}-${h.position}-${h.id ?? i}`}
          type={h.type}
          position={h.position}
          id={h.id}
          style={handleStyle(selected, h.size)}
        />
      ))}
    </div>
  );
}

function handleStyle(selected: boolean, size: "sm" | "md" = "sm"): CSSProperties {
  const dim = size === "md" ? 10 : 8;
  return {
    width: dim,
    height: dim,
    background: "var(--bg-canvas)",
    border: `2px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
    transition: "border-color var(--dur-fast), transform var(--dur-fast)",
  };
}

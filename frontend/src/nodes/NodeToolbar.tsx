import { X } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { useGraphStore } from "../store/graphStore";

export function NodeToolbar({ nodeId }: { nodeId: string }) {
  const deleteNode = useGraphStore((s) => s.deleteNode);

  const wrapperStyle: CSSProperties = {
    position: "absolute",
    top: -10,
    right: -10,
    display: "flex",
    gap: 4,
    opacity: 0,
    transform: "translateY(-2px)",
    transition:
      "opacity var(--dur-fast) ease, transform var(--dur-fast) ease",
    pointerEvents: "none",
    zIndex: 2,
  };

  const buttonStyle: CSSProperties = {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-xs)",
    background: "var(--bg-elev)",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: 0,
    boxShadow: "var(--shadow-lift)",
    transition: "background-color var(--dur-fast), color var(--dur-fast)",
  };

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    deleteNode(nodeId);
  };

  return (
    <div className="flowpay-node-toolbar" style={wrapperStyle}>
      <button
        type="button"
        aria-label="Delete node"
        title="Delete"
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--danger-soft)";
          e.currentTarget.style.color = "var(--danger)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-elev)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
        style={buttonStyle}
      >
        <X size={12} strokeWidth={2.2} />
      </button>
    </div>
  );
}

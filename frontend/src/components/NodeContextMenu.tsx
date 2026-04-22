import { useEffect, useRef, type CSSProperties } from "react";
import { Copy, Trash2 } from "lucide-react";
import { useGraphStore } from "../store/graphStore";

export interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

const menuStyle: CSSProperties = {
  position: "fixed",
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-pop)",
  padding: 4,
  minWidth: 160,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  gap: 1,
  animation: "flowpay-fade-in 140ms var(--ease-out)",
};

const itemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: "var(--radius-xs)",
  cursor: "pointer",
  fontSize: 13,
  color: "var(--text)",
  border: "none",
  background: "transparent",
  width: "100%",
  textAlign: "left",
  fontFamily: "inherit",
};

export default function NodeContextMenu({
  state,
  onClose,
}: {
  state: ContextMenuState;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const deleteNode = useGraphStore((s) => s.deleteNode);
  const duplicateNode = useGraphStore((s) => s.duplicateNode);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const hover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
  };
  const unhover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "transparent";
  };

  return (
    <div
      ref={ref}
      style={{ ...menuStyle, left: state.x, top: state.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        style={itemStyle}
        onMouseEnter={hover}
        onMouseLeave={unhover}
        onClick={() => {
          duplicateNode(state.nodeId);
          onClose();
        }}
      >
        <Copy size={14} strokeWidth={2} color="var(--text-muted)" />
        Duplicate
      </button>
      <button
        type="button"
        style={itemStyle}
        onMouseEnter={hover}
        onMouseLeave={unhover}
        onClick={() => {
          deleteNode(state.nodeId);
          onClose();
        }}
      >
        <Trash2 size={14} strokeWidth={2} color="var(--text-muted)" />
        Delete
      </button>
    </div>
  );
}

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
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: 6,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
  padding: 4,
  minWidth: 150,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  gap: 1,
};

const itemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
  color: "#09090b",
  border: "none",
  background: "transparent",
  width: "100%",
  textAlign: "left",
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
    e.currentTarget.style.backgroundColor = "#f4f4f5";
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
        <Copy size={14} strokeWidth={2} color="#3f3f46" />
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
        <Trash2 size={14} strokeWidth={2} color="#3f3f46" />
        Delete
      </button>
    </div>
  );
}

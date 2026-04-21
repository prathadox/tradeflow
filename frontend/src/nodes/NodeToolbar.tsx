import { X } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { useGraphStore } from "../store/graphStore";

/**
 * Floating hover-toolbar at the top-right of a node card.
 * Visible only on the parent card's :hover state (CSS via the wrapping .fp-node-hover).
 * Exposes a single monochrome "×" button that deletes the node + its edges.
 */
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
    transition: "opacity 0.12s ease, transform 0.12s ease",
    pointerEvents: "none",
    zIndex: 2,
  };

  const buttonStyle: CSSProperties = {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e4e4e7",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    color: "#3f3f46",
    cursor: "pointer",
    padding: 0,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
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
          e.currentTarget.style.backgroundColor = "#f4f4f5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
        }}
        style={buttonStyle}
      >
        <X size={12} strokeWidth={2.2} />
      </button>
    </div>
  );
}

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowLeftRight, Send } from "lucide-react";
import { useGraphStore, type FlowNode } from "../store/graphStore";
import { NodeToolbar } from "./NodeToolbar";

export default function ActionNode({ id, data, selected }: NodeProps<FlowNode>) {
  const isTrade = data.nodeType === "trade";
  const Icon = isTrade ? ArrowLeftRight : Send;
  const amount = data.params.amount as string | number | undefined;
  const baseAssetId = data.params.baseAssetId as string | null | undefined;
  const quoteAssetId = data.params.quoteAssetId as string | null | undefined;

  const nodes = useGraphStore((s) => s.nodes);

  const assetCode = (nid?: string | null): string => {
    if (!nid) return "—";
    const n = nodes.find((x) => x.id === nid);
    if (!n || n.data.kind !== "asset") return "—";
    const code = String(n.data.params.code ?? "").trim();
    return code || "—";
  };

  const subtitle = isTrade
    ? `${amount ?? "0"} ${assetCode(baseAssetId)}  →  ${assetCode(quoteAssetId)}`
    : "Transfer";

  const assetHandleStyle: React.CSSProperties = {
    width: "8px",
    height: "8px",
    backgroundColor: "#ffffff",
    border: `2px solid ${selected ? "#09090b" : "#d4d4d8"}`,
    transition: "border-color 0.2s ease",
  };

  const triggerHandleStyle: React.CSSProperties = {
    width: "10px",
    height: "10px",
    backgroundColor: "#ffffff",
    border: `2px solid ${selected ? "#09090b" : "#a1a1aa"}`,
    transition: "border-color 0.15s ease",
  };

  return (
    <div
      style={{
        position: "relative",
        background: "#ffffff",
        border: `${selected ? "2px" : "1px"} solid ${selected ? "#09090b" : "#e4e4e7"}`,
        borderRadius: "10px",
        minWidth: "220px",
        padding: selected ? "15px" : "16px",
        transition: "all 0.15s ease-in-out",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <NodeToolbar nodeId={id} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: "#f4f4f5",
          border: "1px solid #e4e4e7",
          color: "#3f3f46",
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={2} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#09090b",
            letterSpacing: "-0.2px",
          }}
        >
          {data.label}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 400,
            color: "#71717a",
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Trigger input — top */}
      <Handle
        type="target"
        position={Position.Top}
        id="trigger"
        style={triggerHandleStyle}
      />

      {/* Single unified assets input — left */}
      <Handle
        type="target"
        position={Position.Left}
        id="assets"
        style={assetHandleStyle}
      />
    </div>
  );
}

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { TrendingUp } from "lucide-react";
import { useGraphStore, type FlowNode } from "../store/graphStore";
import { truncateIssuer } from "./nodeStyles";
import { NodeToolbar } from "./NodeToolbar";

export default function StrategyNode({ id, data, selected }: NodeProps<FlowNode>) {
  const pair = data.params.pair as string | undefined;
  const threshold = data.params.threshold as number | undefined;
  const dryRun = data.params.dryRun as boolean | undefined;
  const baseAssetId = data.params.baseAssetId as string | null | undefined;
  const quoteAssetId = data.params.quoteAssetId as string | null | undefined;

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  // Derive pair preview from the assigned baseAssetId/quoteAssetId params.
  // Legacy fallback: if params are unset but edges still use base/quote handles,
  // honor those so older workflows don't look broken in the UI.
  let derivedPair: string | null = null;
  const byId = (nid: string | null | undefined) =>
    nid ? nodes.find((n) => n.id === nid) : undefined;

  let baseNode = byId(baseAssetId);
  let quoteNode = byId(quoteAssetId);

  if (!baseNode || !quoteNode) {
    const incoming = edges.filter((e) => e.target === id);
    const baseEdge = incoming.find((e) => e.targetHandle === "base");
    const quoteEdge = incoming.find((e) => e.targetHandle === "quote");
    if (!baseNode && baseEdge)
      baseNode = nodes.find((n) => n.id === baseEdge.source);
    if (!quoteNode && quoteEdge)
      quoteNode = nodes.find((n) => n.id === quoteEdge.source);
  }

  if (baseNode?.data.kind === "asset" && quoteNode?.data.kind === "asset") {
    const baseCode = String(baseNode.data.params.code ?? "").trim();
    const quoteCode = String(quoteNode.data.params.code ?? "").trim();
    const quoteIssuer = String(quoteNode.data.params.issuer ?? "").trim();
    if (baseCode && quoteCode) {
      const qShort = truncateIssuer(quoteIssuer);
      derivedPair = qShort
        ? `${baseCode}/${quoteCode}:${qShort}`
        : `${baseCode}/${quoteCode}`;
    }
  }

  const subtitlePair = derivedPair ?? pair ?? "—";
  const subtitle = `${subtitlePair} · thr ${threshold ?? "—"}${
    dryRun ? " · dry" : ""
  }`;

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
        <TrendingUp size={16} strokeWidth={2} />
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
            fontWeight: 500,
            color: "#71717a",
            fontFamily: derivedPair
              ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              : "inherit",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
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

      {/* Output — right */}
      <Handle
        type="source"
        position={Position.Right}
        style={assetHandleStyle}
      />
    </div>
  );
}

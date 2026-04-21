import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Coins } from "lucide-react";
import type { FlowNode } from "../store/graphStore";
import { truncateIssuer } from "./nodeStyles";
import { NodeToolbar } from "./NodeToolbar";

export default function AssetNode({ id, data, selected }: NodeProps<FlowNode>) {
  const rawCode = (data.params.code as string | undefined) ?? "";
  const rawIssuer = (data.params.issuer as string | undefined) ?? "";
  const code = rawCode.trim();
  const issuer = rawIssuer.trim();

  const title = code || "Untitled asset";
  const subtitle = issuer ? truncateIssuer(issuer) : "native";

  const handleStyle: React.CSSProperties = {
    width: "8px",
    height: "8px",
    backgroundColor: "#ffffff",
    border: `2px solid ${selected ? "#09090b" : "#d4d4d8"}`,
    transition: "border-color 0.2s ease",
  };

  return (
    <div
      style={{
        position: "relative",
        background: "#ffffff",
        border: `${selected ? "2px" : "1px"} solid ${selected ? "#09090b" : "#e4e4e7"}`,
        borderRadius: "10px",
        minWidth: "200px",
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
        <Coins size={16} strokeWidth={2} />
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
            color: code ? "#09090b" : "#a1a1aa",
            letterSpacing: "-0.2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "#71717a",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

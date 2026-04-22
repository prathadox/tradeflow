import { Position, type NodeProps } from "@xyflow/react";
import { ArrowLeftRight, Send } from "lucide-react";
import { useGraphStore, type FlowNode } from "../store/graphStore";
import BaseNode from "./BaseNode";

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
    ? `${amount ?? "0"} ${assetCode(baseAssetId)} → ${assetCode(quoteAssetId)}`
    : "Transfer";

  return (
    <BaseNode
      id={id}
      kind="action"
      selected={!!selected}
      icon={<Icon size={15} strokeWidth={2} />}
      title={data.label}
      subtitle={subtitle}
      subtitleMono
      minWidth={230}
      handles={[
        { type: "target", position: Position.Top, id: "trigger", size: "md" },
        { type: "target", position: Position.Left, id: "assets" },
      ]}
    />
  );
}

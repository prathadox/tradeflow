import { Position, type NodeProps } from "@xyflow/react";
import { Coins } from "lucide-react";
import type { FlowNode } from "../store/graphStore";
import { truncateIssuer } from "./nodeStyles";
import BaseNode from "./BaseNode";

export default function AssetNode({ id, data, selected }: NodeProps<FlowNode>) {
  const rawCode = (data.params.code as string | undefined) ?? "";
  const rawIssuer = (data.params.issuer as string | undefined) ?? "";
  const code = rawCode.trim();
  const issuer = rawIssuer.trim();

  return (
    <BaseNode
      id={id}
      kind="asset"
      selected={!!selected}
      icon={<Coins size={15} strokeWidth={2} />}
      title={code || "Untitled asset"}
      subtitle={issuer ? truncateIssuer(issuer) : "native"}
      subtitleMono
      handles={[{ type: "source", position: Position.Right }]}
    />
  );
}

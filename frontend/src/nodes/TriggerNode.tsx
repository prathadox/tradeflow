import { Position, type NodeProps } from "@xyflow/react";
import { Clock, Mail } from "lucide-react";
import type { FlowNode } from "../store/graphStore";
import BaseNode from "./BaseNode";

export default function TriggerNode({ id, data, selected }: NodeProps<FlowNode>) {
  const interval = data.params.interval as number | undefined;
  const isTime = data.nodeType === "time_interval";
  const Icon = isTime ? Clock : Mail;
  const subtitle = isTime ? `Every ${interval ?? "—"}s` : "Coming soon";

  return (
    <BaseNode
      id={id}
      kind="trigger"
      selected={!!selected}
      icon={<Icon size={15} strokeWidth={2} />}
      title={data.label}
      subtitle={subtitle}
      handles={[{ type: "source", position: Position.Right }]}
    />
  );
}

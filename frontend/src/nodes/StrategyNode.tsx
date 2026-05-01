import { Position, type NodeProps } from "@xyflow/react";
import { TrendingUp } from "lucide-react";
import { useGraphStore, type FlowNode } from "../store/graphStore";
import { truncateIssuer } from "./nodeStyles";
import BaseNode from "./BaseNode";

export default function StrategyNode({ id, data, selected }: NodeProps<FlowNode>) {
  const pair = data.params.pair as string | undefined;
  const threshold = data.params.threshold as number | undefined;
  const dryRun = data.params.dryRun as boolean | undefined;
  const baseAssetId = data.params.baseAssetId as string | null | undefined;
  const quoteAssetId = data.params.quoteAssetId as string | null | undefined;

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

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

  let derivedPair: string | null = null;
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

  return (
    <BaseNode
      id={id}
      kind="strategy"
      selected={!!selected}
      icon={<TrendingUp size={15} strokeWidth={2} />}
      title={data.label}
      subtitle={subtitle}
      subtitleMono={!!derivedPair}
      minWidth={230}
      handles={[
        { type: "target", position: Position.Top, id: "trigger", size: "md" },
        {
          type: "target",
          position: Position.Left,
          id: "base",
          topPercent: 0.32,
          label: "base",
          labelSide: "right",
        },
        {
          type: "target",
          position: Position.Left,
          id: "quote",
          topPercent: 0.68,
          label: "quote",
          labelSide: "right",
        },
        { type: "source", position: Position.Right },
      ]}
    />
  );
}

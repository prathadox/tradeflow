import type { Edge } from "@xyflow/react";
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  TriggerType,
  StrategyType,
  ActionType,
  AssetType,
} from "@shared/types";
import type { FlowNode, NodeKind } from "../store/graphStore";

interface SerializerInput {
  id: string | null;
  name: string;
  nodes: FlowNode[];
  edges: Edge[];
}

export function toWorkflowJson(state: SerializerInput): Omit<Workflow, "id"> & {
  id?: string;
} {
  const wfNodes: WorkflowNode[] = state.nodes.map((n) => ({
    id: n.id,
    kind: n.data.kind,
    type: n.data.nodeType as TriggerType | StrategyType | ActionType | AssetType,
    params: n.data.params,
  }));
  const wfEdges: WorkflowEdge[] = state.edges.map((e) => {
    const edge: WorkflowEdge = { source: e.source, target: e.target };
    if (e.sourceHandle) edge.sourceHandle = e.sourceHandle;
    if (e.targetHandle) edge.targetHandle = e.targetHandle;
    return edge;
  });
  const out: Omit<Workflow, "id"> & { id?: string } = {
    name: state.name,
    nodes: wfNodes,
    edges: wfEdges,
  };
  if (state.id) out.id = state.id;
  return out;
}

const KIND_LABELS: Record<string, string> = {
  time_interval: "Time Trigger",
  payment: "Payment Trigger",
  arbitrage: "Arbitrage Strategy",
  trade: "Trade Action",
  transfer: "Transfer Action",
  stellar_asset: "Stellar Asset",
};

export function fromWorkflowJson(wf: Workflow): {
  nodes: FlowNode[];
  edges: Edge[];
} {
  // Legacy migration: if a strategy/action has no baseAssetId/quoteAssetId but
  // has incoming edges on `base` / `quote` target handles, surface those IDs
  // into the new params so the dropdowns populate correctly.
  const legacyAssign: Record<string, { baseAssetId?: string; quoteAssetId?: string }> = {};
  for (const e of wf.edges) {
    if (e.targetHandle === "base") {
      legacyAssign[e.target] ??= {};
      legacyAssign[e.target].baseAssetId = e.source;
    } else if (e.targetHandle === "quote") {
      legacyAssign[e.target] ??= {};
      legacyAssign[e.target].quoteAssetId = e.source;
    }
  }

  const nodes: FlowNode[] = wf.nodes.map((n, idx) => {
    const params: Record<string, unknown> = { ...n.params };
    if (n.kind === "strategy" || n.kind === "action") {
      const legacy = legacyAssign[n.id];
      if (legacy) {
        if (
          legacy.baseAssetId &&
          (params.baseAssetId === undefined || params.baseAssetId === null)
        ) {
          params.baseAssetId = legacy.baseAssetId;
        }
        if (
          legacy.quoteAssetId &&
          (params.quoteAssetId === undefined || params.quoteAssetId === null)
        ) {
          params.quoteAssetId = legacy.quoteAssetId;
        }
      }
    }
    return {
      id: n.id,
      type: n.kind,
      position: { x: 100 + (idx % 3) * 260, y: 80 + Math.floor(idx / 3) * 180 },
      data: {
        label: KIND_LABELS[n.type] ?? n.type,
        kind: n.kind as NodeKind,
        nodeType: n.type,
        params,
      },
    };
  });
  // Strategy nodes now carry distinct base/quote handles, so target handles
  // are preserved verbatim. Edges saved before this change with a generic
  // "assets" handle simply land on the strategy's general drop zone — users
  // can re-wire to the explicit base/quote handle when they reopen.
  const edges: Edge[] = wf.edges.map((e, idx) => {
    const edge: Edge = {
      id: `e-${idx}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
    };
    if (e.sourceHandle) edge.sourceHandle = e.sourceHandle;
    if (e.targetHandle) edge.targetHandle = e.targetHandle;
    return edge;
  });
  return { nodes, edges };
}

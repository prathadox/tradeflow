export type TriggerType = "time_interval" | "payment";
export type StrategyType = "arbitrage";
export type ActionType = "trade" | "transfer";
export type AssetType = "stellar_asset";

export interface WorkflowNode {
  id: string;
  kind: "trigger" | "strategy" | "action" | "asset";
  type: TriggerType | StrategyType | ActionType | AssetType;
  params: Record<string, unknown>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

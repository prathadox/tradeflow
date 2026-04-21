import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import type { Workflow } from "@shared/types";
import { fromWorkflowJson } from "../lib/workflowSerializer";

export type NodeKind = "trigger" | "strategy" | "action" | "asset";

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  kind: NodeKind;
  nodeType: string;
  params: Record<string, unknown>;
}

export type FlowNode = Node<FlowNodeData>;

interface GraphState {
  id: string | null;
  name: string;
  nodes: FlowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  setName: (name: string) => void;
  setId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: FlowNode) => void;
  updateNodeParams: (id: string, params: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  loadWorkflow: (wf: Workflow) => void;
  reset: () => void;
}

let dupSeq = 1;
const nextDupId = () =>
  `n_${Date.now().toString(36)}_dup${dupSeq++}`;

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      id: null,
      name: "",
      nodes: [],
      edges: [],
      selectedNodeId: null,
      setName: (name) => set({ name }),
      setId: (id) => set({ id }),
      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
      onNodesChange: (changes) => {
        const nextNodes = applyNodeChanges(changes, get().nodes) as FlowNode[];
        const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
        const state = get();
        let selectedNodeId = state.selectedNodeId;
        if (selectedNodeId && removed.includes(selectedNodeId)) {
          selectedNodeId = null;
        }
        let edges = state.edges;
        if (removed.length > 0) {
          const ids = new Set(nextNodes.map((n) => n.id));
          edges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
        }
        set({ nodes: nextNodes, selectedNodeId, edges });
      },
      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges(changes, get().edges) }),
      onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      addNode: (node) => set({ nodes: [...get().nodes, node] }),
      updateNodeParams: (id, params) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, params } } : n
          ),
        }),
      deleteNode: (id) => {
        const state = get();
        set({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        });
      },
      duplicateNode: (id) => {
        const state = get();
        const src = state.nodes.find((n) => n.id === id);
        if (!src) return;
        const newId = nextDupId();
        const copy: FlowNode = {
          ...src,
          id: newId,
          position: { x: src.position.x + 40, y: src.position.y + 40 },
          selected: false,
          data: { ...src.data, params: { ...src.data.params } },
        };
        set({ nodes: [...state.nodes, copy] });
      },
      loadWorkflow: (wf) => {
        const { nodes, edges } = fromWorkflowJson(wf);
        set({ id: wf.id, name: wf.name, nodes, edges, selectedNodeId: null });
      },
      reset: () =>
        set({
          id: null,
          name: "",
          nodes: [],
          edges: [],
          selectedNodeId: null,
        }),
    }),
    {
      name: "flowpay:draft",
      version: 1,
      partialize: (s) => ({
        id: s.id,
        name: s.name,
        nodes: s.nodes,
        edges: s.edges,
      }),
    }
  )
);

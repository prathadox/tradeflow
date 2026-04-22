import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type Node,
} from "@xyflow/react";
import { useGraphStore, type FlowNode } from "../store/graphStore";
import NodePalette, { type PaletteItem } from "../components/NodePalette";
import Inspector from "../components/Inspector";
import TopBar from "../components/TopBar";
import NodeContextMenu, {
  type ContextMenuState,
} from "../components/NodeContextMenu";
import ActivityPanel from "../components/ActivityPanel";
import TriggerNode from "../nodes/TriggerNode";
import StrategyNode from "../nodes/StrategyNode";
import ActionNode from "../nodes/ActionNode";
import AssetNode from "../nodes/AssetNode";

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  strategy: StrategyNode,
  action: ActionNode,
  asset: AssetNode,
};

let nodeIdSeq = 1;
const nextId = () => `n_${Date.now().toString(36)}_${nodeIdSeq++}`;

function Canvas({
  onNodeContextMenu,
}: {
  onNodeContextMenu: (state: ContextMenuState) => void;
}) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const addNode = useGraphStore((s) => s.addNode);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/flowpay-node");
      if (!raw) return;
      const item = JSON.parse(raw) as PaletteItem;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: FlowNode = {
        id: nextId(),
        type: item.kind,
        position,
        data: {
          label: item.label,
          kind: item.kind,
          nodeType: item.nodeType,
          params: { ...item.defaultParams },
        },
      };
      addNode(newNode);
    },
    [addNode, screenToFlowPosition]
  );

  const minimapNodeColor = useCallback((_node: Node) => "#394357", []);

  const handleNodeContext = useCallback(
    (e: ReactMouseEvent, node: Node) => {
      e.preventDefault();
      setSelectedNodeId(node.id);
      onNodeContextMenu({ nodeId: node.id, x: e.clientX, y: e.clientY });
    },
    [onNodeContextMenu, setSelectedNodeId]
  );

  return (
    <div
      ref={wrapperRef}
      style={{
        flex: 1,
        height: "100%",
        position: "relative",
        background: "var(--bg-canvas)",
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        onNodeContextMenu={handleNodeContext}
        deleteKeyCode={["Delete", "Backspace"]}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--bg-canvas)" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#2A313E"
          gap={22}
          size={1.4}
          style={{ background: "var(--bg-canvas)", opacity: 0.6 }}
        />

        <Controls />

        <MiniMap
          pannable
          zoomable
          nodeColor={minimapNodeColor}
          nodeStrokeColor="#2A313E"
          nodeStrokeWidth={2}
          maskColor="rgba(11, 13, 18, 0.7)"
          style={{
            width: 180,
            height: 120,
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowBuilder() {
  const [ctx, setCtx] = useState<ContextMenuState | null>(null);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const workflowId = useGraphStore((s) => s.id);

  const sidebarStyle = useMemo<React.CSSProperties>(
    () => ({
      width: 264,
      background: "var(--bg-panel)",
      borderRight: "1px solid var(--border)",
      overflowY: "auto",
      zIndex: 10,
      flexShrink: 0,
    }),
    []
  );

  const inspectorOpen = !!selectedNodeId;
  const inspectorShellStyle = useMemo<React.CSSProperties>(
    () => ({
      width: inspectorOpen ? 340 : 0,
      flexShrink: 0,
      overflow: "hidden",
      transition: "width var(--dur-mid) var(--ease-out)",
      background: "var(--bg-panel)",
      borderLeft: inspectorOpen ? "1px solid var(--border)" : "none",
    }),
    [inspectorOpen]
  );

  const inspectorInnerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: 340,
      height: "100%",
      overflowY: "auto",
      transform: inspectorOpen ? "translateX(0)" : "translateX(100%)",
      transition: "transform var(--dur-mid) var(--ease-out)",
    }),
    [inspectorOpen]
  );

  return (
    <div
      className="fp-builder-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-canvas)",
      }}
    >
      <style>{`
        @media (max-width: 1023px) {
          .fp-builder-shell > .fp-builder-main { display: none !important; }
          .fp-builder-shell > .fp-builder-narrow { display: flex !important; }
        }
        .fp-builder-narrow { display: none; }
      `}</style>

      <TopBar />

      <div className="fp-builder-narrow"
        style={{
          flex: 1,
          display: "none",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          The builder is desktop-only
        </div>
        <div style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
          Reload at ≥1024px wide to compose workflows. The landing page works on any screen size.
        </div>
      </div>

      <div
        className="fp-builder-main"
        style={{ display: "flex", flex: 1, minHeight: 0 }}
      >
        <aside style={sidebarStyle}>
          <NodePalette />
        </aside>

        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-canvas)",
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <ReactFlowProvider>
              <Canvas onNodeContextMenu={setCtx} />
            </ReactFlowProvider>
          </div>
          <div
            style={{
              height: 240,
              borderTop: "1px solid var(--border)",
              background: "var(--bg-panel)",
              flexShrink: 0,
            }}
          >
            <ActivityPanel workflowId={workflowId} />
          </div>
        </main>

        <aside style={inspectorShellStyle}>
          <div style={inspectorInnerStyle}>
            {inspectorOpen && <Inspector />}
          </div>
        </aside>
      </div>

      {ctx && <NodeContextMenu state={ctx} onClose={() => setCtx(null)} />}
    </div>
  );
}

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
import TopBar, { type BannerMessage } from "../components/TopBar";
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

  const minimapNodeColor = useCallback((_node: Node) => "#a1a1aa", []);

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
        background: "#fafafa",
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
        style={{ background: "#fafafa" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#d4d4d8"
          gap={22}
          size={1.4}
          style={{ background: "#fafafa", opacity: 0.55 }}
        />

        <Controls
          style={{
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e4e4e7",
            borderRadius: 6,
            background: "#ffffff",
          }}
        />

        <MiniMap
          pannable
          zoomable
          nodeColor={minimapNodeColor}
          nodeStrokeColor="#e4e4e7"
          nodeStrokeWidth={2}
          maskColor="rgba(250, 250, 250, 0.85)"
          style={{
            background: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: 6,
            width: 180,
            height: 120,
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowBuilder() {
  const [banner, setBanner] = useState<BannerMessage | null>(null);
  const [ctx, setCtx] = useState<ContextMenuState | null>(null);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const workflowId = useGraphStore((s) => s.id);

  const sidebarStyle = useMemo<React.CSSProperties>(
    () => ({
      width: 260,
      backgroundColor: "#ffffff",
      borderRight: "1px solid #e4e4e7",
      overflowY: "auto",
      zIndex: 10,
      flexShrink: 0,
    }),
    []
  );

  const inspectorOpen = !!selectedNodeId;
  const inspectorShellStyle = useMemo<React.CSSProperties>(
    () => ({
      width: inspectorOpen ? 320 : 0,
      flexShrink: 0,
      overflow: "hidden",
      transition: "width 200ms ease-out",
      backgroundColor: "#ffffff",
      borderLeft: inspectorOpen ? "1px solid #e4e4e7" : "none",
    }),
    [inspectorOpen]
  );

  const inspectorInnerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: 320,
      height: "100%",
      overflowY: "auto",
      transform: inspectorOpen ? "translateX(0)" : "translateX(100%)",
      transition: "transform 200ms ease-out",
    }),
    [inspectorOpen]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#ffffff",
      }}
    >
      <TopBar banner={banner} setBanner={setBanner} />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside style={sidebarStyle}>
          <NodePalette />
        </aside>

        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fafafa",
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
              height: 220,
              borderTop: "1px solid #e4e4e7",
              backgroundColor: "#ffffff",
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
